const { test, expect } = require('@playwright/test');
const path = require('path');
const HomePage = require('../pages/HomePage');
const ProcessLibraryPage = require('../pages/ProcessLibraryPage');
const ProcessDetailsPage = require('../pages/ProcessDetailsPage');
const { parseProcessNames, runMultipleProcesses } = require('../utils/multi-process-runner');

test.describe('ProcessChecker Automation', () => {
  test('Search for user-entered process name', async ({ browser }) => {
    // Set infinite timeout for this test since we wait for user to close results page
    test.setTimeout(0);
    
    // Loop to allow multiple searches
    let continueSearching = true;
    let inputPage = null;
    
    while (continueSearching) {
      // Open input form (or reuse existing page from "New Search")
      if (!inputPage || inputPage.isClosed()) {
        const inputContext = await browser.newContext();
        inputPage = await inputContext.newPage();
        
        const formPath = 'file:///' + path.resolve(__dirname, '../input-form.html').replace(/\\/g, '/');
        await inputPage.goto(formPath);
      }
      
      // Ensure the page title is reset and form is ready (wait for page load to complete)
      console.log('⏱️  Waiting for form to be fully ready...');
      
      await inputPage.waitForFunction(
        () => {
          const titleReady = document.title === 'Process Search - Input';
          const inputField = document.getElementById('processName');
          const inputEmpty = inputField && inputField.value === '';
          const formReady = window.isFormReady === true; // Check our custom ready flag
          const processNameCleared = !window.processName || window.processName === '';
          return titleReady && inputEmpty && formReady && processNameCleared;
        },
        { timeout: 10000 }
      );
      
      // Store the current title and process name to detect CHANGES (prevents detecting old state)
      const initialTitle = await inputPage.title();
      const initialProcessName = await inputPage.evaluate(() => window.processName || '');
      console.log(`✅ Form ready. Title: "${initialTitle}", ProcessName: "${initialProcessName}"`);
      
      console.log('\n' + '='.repeat(70));
      console.log('⏳ Waiting for user input...');
      console.log('   (The form is reset and ready for NEW input)');
      console.log('='.repeat(70));
      
      // Wait for user to submit the form (title CHANGES FROM initial state)
      let processName = '';
      try {
        await inputPage.waitForFunction(
          (startTitle, startProcessName) => {
            const currentTitle = document.title;
            const currentProcessName = window.processName || '';
            // Only detect if title CHANGED from the initial reset state
            // AND it's a valid submission state
            const titleChanged = currentTitle !== startTitle;
            const processNameChanged = currentProcessName !== startProcessName;
            const isValidSubmission = currentTitle.startsWith('SUBMITTED:') || currentTitle === 'CANCELLED';
            
            // Log for debugging (visible in browser console)
            if (titleChanged || processNameChanged) {
              console.log('State change detected:', { currentTitle, currentProcessName, startTitle, startProcessName });
            }
            
            return titleChanged && isValidSubmission && processNameChanged;
          },
          { timeout: 0 }, // Infinite timeout for input
          initialTitle, // Pass initial title as argument
          initialProcessName // Pass initial process name as argument
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
      
      // ========== NEW: Multi-Process Detection ==========
      // Parse input to check if multiple process names were entered
      const processNames = parseProcessNames(processName);
      
      if (processNames.length > 1) {
        // MULTI-PROCESS MODE: Launch separate tabs for each process
        console.log(`🔀 Detected ${processNames.length} process names - launching multi-tab search`);
        console.log(`   Processes: ${processNames.join(', ')}\n`);
        
        // Close the input page since we'll show results in separate tabs
        await inputPage.close();
        
        // Create a new context for the multi-process search
        const multiContext = await browser.newContext();
        
        // Run multiple processes in parallel with concurrency limit
        const multiResults = await runMultipleProcesses(multiContext, processNames, 10);
        
        // Log summary
        const foundCount = multiResults.filter(r => r.processFound).length;
        console.log(`\n✅ Multi-search completed: ${foundCount}/${processNames.length} found`);
        console.log(`📑 ${processNames.length} tabs remain open with individual results`);
        console.log(`👋 Click "🔄 New Search" in any tab or close all tabs.\n`);
        
        // Wait for user to either close all tabs OR click "New Search" in any tab
        console.log('⏸️  Waiting for your next action...\n');
        
        const pages = multiContext.pages();
        if (pages.length > 0) {
          // Race between: any page navigating to input-form.html OR all pages closing
          const navigationPromises = pages.map(p => 
            p.waitForNavigation({ url: '**/input-form.html', timeout: 0 })
              .then(() => ({ action: 'navigated', page: p }))
              .catch(() => null) // Ignore errors (page closed)
          );
          
          const closePromise = Promise.all(
            pages.map(p => p.waitForEvent('close', { timeout: 0 }))
          ).then(() => ({ action: 'closed' }));
          
          const result = await Promise.race([
            ...navigationPromises,
            closePromise
          ]);
          
          if (result && result.action === 'navigated') {
            console.log('\n🔄 New search requested from results tab...\n');
            
            // Close all other tabs in the multi-context
            const pagesToClose = multiContext.pages().filter(p => p !== result.page);
            await Promise.all(pagesToClose.map(p => p.close().catch(() => {})));
            
            // CRITICAL: Force a fresh reload to clear any cached form state
            // This prevents the browser from auto-filling old process names
            const formPath = 'file:///' + path.resolve(__dirname, '../input-form.html').replace(/\\/g, '/');
            await result.page.goto(formPath + '?t=' + Date.now()); // Cache-busting timestamp
            
            // Wait for the page to fully reload and window.onload to complete
            await result.page.waitForLoadState('load');
            
            // Explicitly reset any lingering state in the page context
            await result.page.evaluate(() => {
              window.processName = '';
              document.title = 'Process Search - Input';
              const input = document.getElementById('processName');
              if (input) {
                input.value = '';
                input.defaultValue = '';
              }
            });
            
            // Wait for form to be fully ready
            await result.page.waitForTimeout(300);
            
            console.log('✅ Form state fully reset and ready for new input\n');
            
            // Use the navigated page as the new input page
            inputPage = result.page;
            
            continueSearching = true;
            // Loop continues
            continue; 
          } else {
            console.log('\n👋 All tabs closed. Exiting...\n');
            continueSearching = false;
            break;
          }
        } else {
          continueSearching = false;
          break;
        }
      }
      
      // SINGLE-PROCESS MODE: Continue with existing flow
      console.log(`🔍 Single process mode - running standard search\n`);
      
      // Start timing AFTER user input is captured
      const startTime = Date.now();
      
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
      let processFound = true;
      let allData = [];
      let foundInfo = { foundOnPage: null, letter: null };
      
      try {
        foundInfo = await library.openProcess(processName);
        
        // 4️⃣ Extract ALL file paths data
        allData = await details.getAllFilePathsData();
        
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
      } catch (error) {
        // Process not found
        processFound = false;
        console.log(`\n${'='.repeat(70)}`);
        console.log(`❌ Process "${processName}" not found in the database`);
        console.log(`${'='.repeat(70)}\n`);
      }

      // 5️⃣ Display results in the input page (reuse the same window)
      const resultsPath = 'file:///' + path.resolve(__dirname, '../results.html').replace(/\\/g, '/');
      await inputPage.goto(resultsPath);
      
      const endTime = Date.now();
      const searchTime = ((endTime - startTime) / 1000).toFixed(2) + 's';
      
      // Load results into the HTML page
      await inputPage.evaluate((resultsData) => {
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
      
      // Wait briefly to ensure results are displayed (reduced from 1000ms to 300ms)
      await inputPage.waitForTimeout(300);
      
      if (processFound) {
        console.log(`✅ Results displayed in UI page.`);
        console.log(`📊 Total search time: ${searchTime}`);
      } else {
        console.log(`❌ Not found message displayed in UI page.`);
        console.log(`📊 Total search time: ${searchTime}`);
      }
      console.log(`🔒 Closing ProcessChecker browser...\n`);
      
      // Close the ProcessChecker search page
      await searchPage.close();
      
      // 6️⃣ Basic validation - only check if process was found
      if (processFound) {
        expect(allData.length).toBeGreaterThan(0);
        expect(allData[0].path.toLowerCase()).toContain(processName.split('.')[0].toLowerCase());
        console.log(`✅ Test completed successfully!`);
      } else {
        console.log(`ℹ️  Test completed - process not found (this is not an error)`);
      }
      console.log(`⏸️  Results page is open. Click "🔄 New Search" or close the page.\n`);

      // Wait for either: user closes the page OR navigates to new search
      const action = await Promise.race([
        inputPage.waitForEvent('close', { timeout: 0 }).then(() => 'closed'),
        inputPage.waitForNavigation({ url: '**/input-form.html', timeout: 0 }).then(() => 'navigated')
      ]).catch(() => 'closed');
      
      if (action === 'navigated') {
        console.log('\n🔄 New search requested...\n');
        
        // Force a fresh reload to clear any cached form state
        const formPath = 'file:///' + path.resolve(__dirname, '../input-form.html').replace(/\\/g, '/');
        await inputPage.goto(formPath + '?t=' + Date.now()); // Cache-busting timestamp
        
        // Wait for the page to fully reload and window.onload to complete
        await inputPage.waitForLoadState('load');
        
        // Explicitly reset any lingering state in the page context
        await inputPage.evaluate(() => {
          window.processName = '';
          document.title = 'Process Search - Input';
          const input = document.getElementById('processName');
          if (input) {
            input.value = '';
            input.defaultValue = '';
          }
        });
        
        // Wait for form to be fully ready
        await inputPage.waitForTimeout(300);
        
        console.log('✅ Form state fully reset and ready for new input\n');
        
        continueSearching = true;
      } else {
        console.log('\n👋 User closed results page. Exiting...\n');
        continueSearching = false;
      }
    }
    
    console.log('🏁 All searches completed.\n');
  });
});
