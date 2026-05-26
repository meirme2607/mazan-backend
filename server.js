const express = require('express');
const cors = require('cors');
const { createScraper, CompanyTypes } = require('israeli-bank-scrapers');

const app = express();
// ב-Render יקצה לנו משתנה סביבה PORT
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const supportedBanks = Object.values(CompanyTypes);

app.post('/api/scrape', async (req, res) => {
  const { username, password, companyId, id, num } = req.body;

  if (!password || !companyId) {
    return res.status(400).json({
      success: false,
      errorType: 'MISSING_CREDENTIALS',
      errorMessage: 'Please provide at least password and companyId'
    });
  }

  if (!supportedBanks.includes(companyId)) {
    return res.status(400).json({
      success: false,
      errorType: 'UNSUPPORTED_BANK',
      errorMessage: `Bank ${companyId} is not supported.`
    });
  }

  try {
    // הגדרות מתאימות גם להרצה בענן
    const options = {
      companyId: companyId,
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      combineInstallments: false,
      showBrowser: false, 
      // חובה כדי ש-Puppeteer ירוץ בתוך Docker/Render:
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    };

    const credentials = {
      username: username || id || '',
      password: password,
      id: id || username || '', 
      num: num || '' 
    };

    const scraper = createScraper(options);
    console.log(`Starting scraper for ${companyId}...`);
    
    const scrapeResult = await scraper.scrape(credentials);

    if (scrapeResult.success) {
      console.log('Scrape successful!');
      return res.json({
        success: true,
        accounts: scrapeResult.accounts
      });
    } else {
      console.error('Scrape failed:', scrapeResult.errorType, scrapeResult.errorMessage);
      return res.status(500).json({
        success: false,
        errorType: scrapeResult.errorType,
        errorMessage: scrapeResult.errorMessage
      });
    }
  } catch (e) {
    console.error('Unexpected error during scraping:', e);
    return res.status(500).json({
      success: false,
      errorType: 'UNKNOWN_ERROR',
      errorMessage: e.message || 'An unexpected error occurred'
    });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Bank scraper backend is running on http://0.0.0.0:${port}`);
  console.log(`Available company IDs: ${supportedBanks.join(', ')}`);
});
