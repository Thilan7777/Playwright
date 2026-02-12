/**
 * Multi-Process Search Orchestrator
 * 
 * Provides utilities for running multiple process searches in parallel tabs.
 * Does NOT modify the existing single-process search logic - reuses it as-is.
 */

const path = require('path');
const HomePage = require('../pages/HomePage');
const ProcessLibraryPage = require('../pages/ProcessLibraryPage');
const ProcessDetailsPage = require('../pages/ProcessDetailsPage');

/**
 * Parse input string into array of process names
 * Supports comma and newline separators, trims whitespace, ignores empty values
 * 
 * @param {string} input - Raw input string (e.g., "chrome.exe, firefox.exe\noutlook.exe")
 * @returns {string[]} - Array of process names
 */
function parseProcessNames(input) {
  if (!input || typeof input !== 'string') {
    return [];
  }

  // Split by newlines first, then by commas
  const names = input
    .split(/[\n,]+/)           // Split by newline or comma
    .map(name => name.trim())   // Trim whitespace
    .filter(name => name.length > 0); // Remove empty strings

  return names;
}

/**
 * Simple concurrency limiter (p-limit style)
 * Limits number of concurrent async operations
 * 
 * @param {number} concurrency - Max concurrent operations (default: 3)
 * @returns {function} - Limiter function that wraps async functions
 */
function createConcurrencyLimiter(concurrency = 3) {
  const queue = [];
  let activeCount = 0;

  const next = () => {
    activeCount--;

    if (queue.length > 0) {
      const { fn, resolve, reject } = queue.shift();
      run(fn, resolve, reject);
    }
  };

  const run = (fn, resolve, reject) => {
    activeCount++;

    fn()
      .then(resolve)
      .catch(reject)
      .finally(next);
  };

  return (fn) => {
    return new Promise((resolve, reject) => {
      if (activeCount < concurrency) {
        run(fn, resolve, reject);
      } else {
        queue.push({ fn, resolve, reject });
      }
    });
  };
}

/**
 * Run single process search in a dedicated page/tab
 * This is the EXISTING single-process algorithm extracted as a reusable function.
 * 
 * @param {object} page - Playwright Page instance (the tab where search will happen)
 * @param {string} processName - Process name to search for
 * @param {number} index - Index number (for logging)
 * @returns {Promise<object>} - Search results
 */
async function runSingleProcessSearch(page, processName, index = 0) {
  console.log(`\n[${ index}] 🔍 Starting search for: ${processName}`);
  
  const startTime = Date.now();
  
  // Initialize page objects using the dedicated page
  const home = new HomePage(page);
  const library = new ProcessLibraryPage(page);
  const details = new ProcessDetailsPage(page);

  let processFound = true;
  let allData = [];
  let foundInfo = { foundOnPage: null, letter: null };

  try {
    // 1️⃣ Open homepage
    await home.open();
    await home.goToProcessLibrary();

    // 2️⃣ Select first letter of process
    await library.selectLetter(processName[0]);

    // 3️⃣ Find process using lexicographical pruning (UNCHANGED ALGORITHM)
    foundInfo = await library.openProcess(processName);
    
    // 4️⃣ Extract ALL file paths data
    allData = await details.getAllFilePathsData();
    
    console.log(`[${index}] ✅ Found ${allData.length} result(s) for: ${processName}`);
    
  } catch (error) {
    // Process not found
    processFound = false;
    console.log(`[${index}] ❌ Process "${processName}" not found in the database`);
  }

  const endTime = Date.now();
  const searchTime = ((endTime - startTime) / 1000).toFixed(2) + 's';

  return {
    processName,
    processFound,
    allData,
    searchTime,
    foundInfo,
    index
  };
}

/**
 * Display results in a dedicated results page/tab
 * Reuses the existing results.html rendering logic
 * 
 * @param {object} page - Playwright Page instance (results tab)
 * @param {object} results - Search results from runSingleProcessSearch
 */
async function displayResultsInTab(page, results) {
  const { processName, processFound, allData, searchTime, foundInfo, index } = results;

  // Load results.html in this tab
  const resultsPath = 'file:///' + path.resolve(__dirname, '../results.html').replace(/\\/g, '/');
  await page.goto(resultsPath);

  // Inject results data into the page (same as original logic)
  await page.evaluate((resultsData) => {
    window.loadResults(resultsData);
  }, {
    processName,
    data: allData,
    length: allData.length,
    searchTime,
    notFound: !processFound,
    foundOnPage: foundInfo.foundOnPage,
    letter: foundInfo.letter
  });

  // Wait briefly to ensure results are displayed
  await page.waitForTimeout(300);

  console.log(`[${index}] 📄 Results displayed in tab for: ${processName}`);
}

/**
 * MAIN ORCHESTRATOR: Run multiple process searches in separate tabs with concurrency control
 * 
 * @param {object} context - Playwright BrowserContext
 * @param {string[]} processNames - Array of process names to search
 * @param {number} concurrency - Max concurrent tabs (default: 3)
 * @returns {Promise<object[]>} - Array of search results
 */
async function runMultipleProcesses(context, processNames, concurrency = 3) {
  console.log('\n' + '='.repeat(70));
  console.log(`🚀 MULTI-PROCESS SEARCH: ${processNames.length} processes`);
  console.log(`⚡ Concurrency limit: ${concurrency} tabs at a time`);
  console.log('='.repeat(70));

  const limiter = createConcurrencyLimiter(concurrency);
  const results = [];

  // Create a search task for each process
  const tasks = processNames.map((processName, index) => {
    return limiter(async () => {
      // Create a new page (tab) for this search
      const page = await context.newPage();
      
      try {
        // Run the single-process search algorithm (UNCHANGED)
        const result = await runSingleProcessSearch(page, processName, index + 1);
        
        // Display results in this tab (each tab shows its own results)
        await displayResultsInTab(page, result);
        
        results.push(result);
        
        // Keep tab open - don't close it (as per requirements)
        return result;
        
      } catch (error) {
        console.error(`[${index + 1}] ❌ Error searching for ${processName}:`, error.message);
        
        // Still return a result object even if failed
        const errorResult = {
          processName,
          processFound: false,
          allData: [],
          searchTime: '0s',
          foundInfo: {},
          index: index + 1,
          error: error.message
        };
        
        results.push(errorResult);
        return errorResult;
      }
    });
  });

  // Wait for all searches to complete
  await Promise.all(tasks);

  console.log('\n' + '='.repeat(70));
  console.log(`✅ Completed ${results.length}/${processNames.length} searches`);
  console.log('='.repeat(70) + '\n');

  return results;
}

module.exports = {
  parseProcessNames,
  createConcurrencyLimiter,
  runSingleProcessSearch,
  displayResultsInTab,
  runMultipleProcesses
};
