class ProcessLibraryPage {
  constructor(page) {
    this.page = page;
  }

  async selectLetter(letter) {
    // Click on the letter link (e.g., A, B, C, etc.)
    // The letters are links with URLs like file.php?start=S
    await this.page.locator(`a[href*="file.php?start=${letter.toUpperCase().trim()}"]`).click();
    
    // Wait for page to fully load
    await this.page.waitForLoadState('load', { timeout: 10000 });
    
    // Wait for table to be visible
    await this.page.waitForSelector('table', { timeout: 10000 });
    
    // Wait for actual table content (process links) to appear
    await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 10000 });
    
    // Wait a bit for any loading overlays/dialogs to disappear
    await this.page.waitForTimeout(1000);
  }

  async openProcess(processName) {
    console.log(`\n🔍 Starting lexicographical search for: ${processName}`);
    console.log('━'.repeat(60));
    
    let pageNum = 1;
    const maxPages = 1000;

    while (pageNum <= maxPages) {
      // Extract first and last process names from current page
      const pageRange = await this.getPageRange();
      
      if (!pageRange.firstItem || !pageRange.lastItem) {
        throw new Error('Unable to extract page range - table structure may have changed');
      }

      console.log(`� Page ${pageNum}: [${pageRange.firstItem}] → [${pageRange.lastItem}]`);

      // RULE 2: Target Before Page → Target doesn't exist
      if (this.compareProcessNames(processName, pageRange.firstItem) < 0) {
        console.log(`❌ Target "${processName}" < First item "${pageRange.firstItem}"`);
        console.log('🛑 TERMINATING: Process does not exist in library');
        throw new Error(`${processName} not found - lexicographically before current page range`);
      }

      // RULE 1: Target After Page → Skip this page
      if (this.compareProcessNames(processName, pageRange.lastItem) > 0) {
        console.log(`⏭️  Target "${processName}" > Last item "${pageRange.lastItem}" - SKIPPING page scan`);
        
        // Navigate to next page
        const nextButton = this.page.locator('a:has-text("»")');
        if (await nextButton.count() === 0) {
          console.log('🛑 No more pages available');
          throw new Error(`${processName} not found after checking ${pageNum} pages`);
        }

        // Fast navigation - wait only for load event (faster than domcontentloaded)
        await Promise.all([
          this.page.waitForLoadState('load', { timeout: 10000 }),
          nextButton.first().click()
        ]);
        pageNum++;
        
        if (pageNum % 50 === 0) {
          console.log(`⏳ Progress: Checked ${pageNum} pages (using pruning)`);
        }
        continue;
      }

      // RULE 3: Target Within Page Range → Detailed scan
      console.log(`✅ Target in range [${pageRange.firstItem}, ${pageRange.lastItem}] - SCANNING rows`);
      
      // Find exact match for process name (including .exe extension)
      const processLinks = this.page.locator('table tr td:nth-child(2) a');
      const linkCount = await processLinks.count();
      
      let found = false;
      for (let i = 0; i < linkCount; i++) {
        const linkText = await processLinks.nth(i).innerText();
        // Exact match comparison (case-insensitive)
        if (linkText.trim().toLowerCase() === processName.toLowerCase()) {
          console.log(`🎯 FOUND exact match "${processName}" on page ${pageNum}`);
          console.log('━'.repeat(60));
          // Fast navigation after clicking
          await Promise.all([
            this.page.waitForLoadState('load', { timeout: 10000 }),
            processLinks.nth(i).click()
          ]);
          found = true;
          return;
        }
      }
      
      if (!found) {
        console.log(`⚠️  Not found in page ${pageNum} despite being in range - continuing...`);
      }

      // Navigate to next page with faster load state
      const nextButton = this.page.locator('a:has-text("»")');
      if (await nextButton.count() === 0) {
        throw new Error(`${processName} not found after searching ${pageNum} pages`);
      }

      // Fast navigation - parallel click and wait
      await Promise.all([
        this.page.waitForLoadState('load', { timeout: 10000 }),
        nextButton.first().click()
      ]);
      pageNum++;
    }

    throw new Error(`${processName} not found after checking maximum ${maxPages} pages`);
  }

  async getPageRange() {
    // Extract first and last process names from the table
    // Table structure: Row#, Path, Product Name, Vendor, Version, Size, MD5
    // Process names are in column 2 (nth-child(2))
    
    // Wait for table content to be available
    try {
      await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 5000 });
    } catch (e) {
      // Debug: capture what's actually on the page
      const pageContent = await this.page.content();
      console.error('❌ Failed to find table content. Page HTML length:', pageContent.length);
      
      // Check if there's a loading dialog or overlay
      const loadingElements = await this.page.locator('text=/searching|loading|please wait/i').count();
      if (loadingElements > 0) {
        console.error('⚠️  Found loading dialog/overlay on page');
      }
      
      return { firstItem: null, lastItem: null };
    }
    
    const processLinks = this.page.locator('table tr td:nth-child(2) a');
    const count = await processLinks.count();
    
    if (count === 0) {
      return { firstItem: null, lastItem: null };
    }

    const firstItem = await processLinks.first().innerText();
    const lastItem = await processLinks.last().innerText();

    return {
      firstItem: firstItem.trim(),
      lastItem: lastItem.trim()
    };
  }

  compareProcessNames(target, reference) {
    // Lexicographical comparison (case-insensitive for sorting purposes)
    const targetLower = target.toLowerCase();
    const referenceLower = reference.toLowerCase();

    if (targetLower < referenceLower) return -1;
    if (targetLower > referenceLower) return 1;
    return 0;
  }
}

module.exports = ProcessLibraryPage;
