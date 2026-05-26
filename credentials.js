const { SCRAPERS } = require('israeli-bank-scrapers');

function normalizeInput(value) {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getValue(body, field) {
  const aliases = {
    userCode: ['userCode', 'username'],
    username: ['username', 'id'],
    email: ['email', 'username'],
    nationalID: ['nationalID', 'id'],
    card6Digits: ['card6Digits', 'num'],
    otpLongTermToken: ['otpLongTermToken'],
    phoneNumber: ['phoneNumber']
  };

  for (const key of aliases[field] || [field]) {
    const value = normalizeInput(body[key]);
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function requiredFieldsForCompany(companyId) {
  const scraper = SCRAPERS[companyId];
  if (!scraper) {
    return [];
  }

  return scraper.loginFields.filter((field) => field !== 'otpCodeRetriever');
}

function buildCredentials(body) {
  const { companyId } = body;
  const fields = requiredFieldsForCompany(companyId);
  const credentials = {};
  const missingFields = [];

  for (const field of fields) {
    const value = getValue(body, field);
    if (value === undefined || value === null) {
      missingFields.push(field);
    } else {
      credentials[field] = value;
    }
  }

  if (missingFields.length > 0) {
    const error = new Error(`Missing required credentials: ${missingFields.join(', ')}`);
    error.code = 'MISSING_CREDENTIALS';
    error.missingFields = missingFields;
    throw error;
  }

  return credentials;
}

module.exports = {
  buildCredentials,
  requiredFieldsForCompany
};
