const { test, expect } = require('@playwright/test');
const path = require('path');
const HomePage = require('../pages/HomePage');
const ProcessLibraryPage = require('../pages/ProcessLibraryPage');
const ProcessDetailsPage = require('../pages/ProcessDetailsPage');

test.describe('ProcessChecker Automation', () => {
  test('Search for user-entered process name', async ({ page, browser }) => {
    // Set infinite timeout for this test since we wait for user to close results page
    test.setTimeout(0);
    
    // Loop to allow multiple searches
    let continueSearching = true;
    let inputPage = null;
    
    while (continueSearching) {
      const startTime = Date.now();
      
      // Open input form (or reuse existing page from "New Search")
      if (!inputPage || inputPage.isClosed()) {
        inputPage = await browser.newContext().then(ctx => ctx.newPage());
        const formPath = 'file:///' + path.resolve(__dirname, '../input-form.html').replace(/\\/g, '/');
        await inputPage.goto(formPath);
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('⏳ Waiting for user input...');
      console.log('='.repeat(70));
      
      // Wait for user to submit the form (title changes to "SUBMITTED:processname")
      let processName = '';
      try {
        await inputPage.waitForFunction(
          () => document.title.startsWith('SUBMITTED:') || document.title === 'CANCELLED',
          { timeout: 0 } // Infinite timeout for input
        );
      } catch (e) {
        if (e.message.includes('Target page, context or browser has been closed')) {
          console.log('👋 User closed the input page. Exiting...\n');
          continueSearching = false;
          break;
        }
        throw e;
      }
      
      const title = await inputPage.title();
      
      if (title === 'CANCELLED') {
        await inputPage.close();
        console.log('❌ User cancelled the search. Exiting...\n');
        continueSearching = false;
        break;
      }
      
      processName = title.replace('SUBMITTED:', '');
      console.log(`✅ User entered: ${processName}\n`);
      
      // Don't close input page - we'll reuse it later for results
      // await inputPage.close(); // REMOVED
      
      // Create a new page for ProcessChecker navigation each time
      const searchPage = await browser.newContext().then(ctx => ctx.newPage());
      
      // Start search in the new search page
      const home = new HomePage(searchPage);
      const library = new ProcessLibraryPage(searchPage);
      const details = new ProcessDetailsPage(searchPage);

      // 1️⃣ Open homepage
      await home.open();
      await home.goToProcessLibrary();

      // 2️⃣ Select first letter of process
      await library.selectLetter(processName[0]);

      // 3️⃣ Find process using lexicographical pruning
      await library.openProcess(processName);

      // 4️⃣ Extract ALL file paths data
      const allData = await details.getAllFilePathsData();
      
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📊 Found ${allData.length} result(s) for: ${processName}`);
      console.log(`${'='.repeat(70)}`);
      
      allData.forEach((row, index) => {
        console.log(`\n[Row ${index + 1}]`);
        console.log(`  Path: ${row.path}`);
        console.log(`  Product Name: ${row.productName}`);
        console.log(`  Vendor: ${row.vendor}`);
        console.log(`  Version: ${row.version}`);
        console.log(`  Size: ${row.size}`);
        console.log(`  MD5: ${row.md5}`);
      });
      
      console.log(`\n${'='.repeat(70)}\n`);

      // 5️⃣ Display results in the input page (reuse the same window)
      const resultsPath = 'file:///' + path.resolve(__dirname, '../results.html').replace(/\\/g, '/');
      await inputPage.goto(resultsPath);
      
      const endTime = Date.now();
      const searchTime = ((endTime - startTime) / 1000).toFixed(2) + 's';
      
      // Load results into the HTML page
      await inputPage.evaluate((resultsData) => {
        window.loadResults(resultsData);
      }, { processName, data: allData, length: allData.length, searchTime });
      
      // Wait a moment to ensure results are displayed
      await inputPage.waitForTimeout(1000);
      
      console.log(`✅ Results displayed in UI page.`);
      console.log(`📊 Total search time: ${searchTime}`);
      console.log(`🔒 Closing ProcessChecker browser...\n`);
      
      // Close the ProcessChecker search page
      await searchPage.close();
      
      // 6️⃣ Basic validation
      expect(allData.length).toBeGreaterThan(0);
      expect(allData[0].path.toLowerCase()).toContain(processName.split('.')[0].toLowerCase());
      
      console.log(`✅ Test completed successfully!`);
      console.log(`⏸️  Results page is open. Click "🔄 New Search" or close the page.\n`);

      // Wait for either: user closes the page OR navigates to new search
      const action = await Promise.race([
        inputPage.waitForEvent('close', { timeout: 0 }).then(() => 'closed'),
        inputPage.waitForNavigation({ url: '**/input-form.html', timeout: 0 }).then(() => 'navigated')
      ]).catch(() => 'closed');
      
      if (action === 'navigated') {
        console.log('\n🔄 New search requested...\n');
        // inputPage is already set to the navigated page - ready for next iteration
        continueSearching = true;
      } else {
        console.log('\n👋 User closed results page. Exiting...\n');
        continueSearching = false;
      }
    }
    
    console.log('🏁 All searches completed.\n');
  });
});
