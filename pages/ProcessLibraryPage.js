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
    
    // Store the base URL for this letter (for direct page navigation)
    this.baseUrl = this.page.url();
  }

  async goToPage(pageNum) {
    // Direct URL navigation to a specific page - much faster than clicking
    const url = `${this.baseUrl}&page=${pageNum}`;
    
    try {
      await this.page.goto(url, { waitUntil: 'load', timeout: 10000 });
      
      // Wait for table to load
      await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 10000 });
      
      // Small delay to ensure page is fully rendered
      await this.page.waitForTimeout(300);
      
      return true; // Page loaded successfully
    } catch (e) {
      // Page doesn't exist or failed to load
      console.warn(`⚠️  Page ${pageNum} failed to load - likely beyond last page`);
      return false; // Page load failed
    }
  }

  async openProcess(processName) {
    // Automatically add .exe suffix if not present
    if (!processName.toLowerCase().endsWith('.exe')) {
      processName = processName + '.exe';
      console.log(`✨ Auto-appended .exe suffix: ${processName}`);
    }
    
    console.log(`\n🔍 Starting EXPONENTIAL BLOCK SEARCH for: ${processName}`);
    console.log('🚀 Using direct URL navigation (no clicking!)');
    console.log('━'.repeat(60));
    
    let currentPage = 1;
    let blockSize = 8;
    let lastValidPage = 1;
    let maxValidPage = null; // Upper bound when we overshoot
    const maxBlockSize = 128;
    const maxPages = 2000;
    let scannedPages = new Set(); // Track pages we've already scanned to avoid infinite loops

    while (currentPage <= maxPages) {
      const pageRange = await this.getPageRange();
      
      if (!pageRange.firstItem || !pageRange.lastItem) {
        // Page loaded but no table data - treat as page doesn't exist
        console.warn(`⚠️  Page ${currentPage} has no table data - likely beyond last page`);
        
        if (blockSize === 1) {
          // At single-step and no data - process not found
          console.log(`🛑 Reached end of pagination (no more data)`);
          throw new Error(`${processName} not found - reached end of available pages`);
        }
        
        // Set upper bound and do binary search
        maxValidPage = currentPage - 1;
        currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
        blockSize = 1;
        
        const pageLoaded = await this.goToPage(currentPage);
        if (!pageLoaded) {
          currentPage = lastValidPage + 1;
          await this.goToPage(currentPage);
        }
        continue;
      }

      console.log(`📍 Page ${currentPage}: [${pageRange.firstItem}] → [${pageRange.lastItem}] (block=${blockSize})`);

      // Debug: If this is page 1009, log all items
      if (currentPage === 1009) {
        const processLinks = this.page.locator('table tr td:nth-child(2) a');
        const count = await processLinks.count();
        console.log(`🔍 DEBUG Page 1009 - Total items: ${count}`);
        for (let i = 0; i < Math.min(count, 10); i++) {
          const item = await processLinks.nth(i).innerText();
          console.log(`  [${i}] ${item}`);
        }
        console.log(`  ...`);
        for (let i = Math.max(count - 5, 10); i < count; i++) {
          const item = await processLinks.nth(i).innerText();
          console.log(`  [${i}] ${item}`);
        }
      }

      // Check if target shares prefix with first item - important for sorting edge cases
      const targetPrefix = processName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 1);
      const firstPrefix = pageRange.firstItem.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 1);
      const sharesFirstPrefix = targetPrefix === firstPrefix;
      
      // Target is before this page - we overshot
      if (this.compareProcessNames(processName, pageRange.firstItem) < 0 && !sharesFirstPrefix) {
        // Check if this is a definitive "not found" case
        if (blockSize === 1 && currentPage === lastValidPage + 1) {
          // We're at single-step right after last valid - doesn't exist
          console.log(`❌ Target "${processName}" < First item "${pageRange.firstItem}"`);
          console.log(`🛑 Process does not exist (checked ${currentPage} pages)`);
          throw new Error(`${processName} not found - lexicographically before current page range`);
        }
        
        // Overshot - update upper bound and do binary search
        console.log(`⬅️  Overshot! Binary search between pages ${lastValidPage} and ${currentPage - 1}`);
        maxValidPage = currentPage - 1;
        
        // Check if binary search range is exhausted
        if (lastValidPage >= maxValidPage) {
          console.log(`🛑 Binary search exhausted (${lastValidPage} >= ${maxValidPage})`);
          throw new Error(`${processName} not found - binary search exhausted`);
        }
        
        currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
        blockSize = 1;
        
        const pageLoaded = await this.goToPage(currentPage);
        if (!pageLoaded) {
          currentPage = lastValidPage + 1;
          await this.goToPage(currentPage);
        }
        continue;
      }

      // Target is within this page range - scan it
      // Also scan if target has same prefix as last item OR first item (safety check for sorting edge cases)
      const lastPrefix = pageRange.lastItem.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 1);
      const comparisonResult = this.compareProcessNames(processName, pageRange.lastItem);
      const sharesLastPrefix = targetPrefix === lastPrefix;
      const shouldScan = comparisonResult <= 0 || 
                         sharesLastPrefix ||
                         sharesFirstPrefix;
      
      if (shouldScan) {
        // Check if we've already scanned this page
        if (scannedPages.has(currentPage)) {
          console.log(`⚠️  Already scanned page ${currentPage} - skipping to next`);
          lastValidPage = currentPage;
          currentPage++;
          const pageLoaded = await this.goToPage(currentPage);
          if (!pageLoaded) {
            console.log(`🛑 Page ${currentPage} doesn't exist - reached end`);
            throw new Error(`${processName} not found - reached end of available pages`);
          }
          continue;
        }
        
        // Mark this page as scanned
        scannedPages.add(currentPage);
        
        let scanReason = 'in-range';  // Track why we're scanning
        if (sharesFirstPrefix && this.compareProcessNames(processName, pageRange.firstItem) < 0) {
          console.log(`✅ Target < firstItem but shares prefix "${targetPrefix}" - SCANNING page ${currentPage}`);
          scanReason = 'prefix-before';
        } else if (sharesLastPrefix && comparisonResult > 0) {
          console.log(`✅ Target > lastItem but shares prefix "${targetPrefix}" - SCANNING page ${currentPage}`);
          scanReason = 'prefix-after';
        } else {
          console.log(`✅ Target in range - SCANNING page ${currentPage}`);
        }
        
        const processLinks = this.page.locator('table tr td:nth-child(2) a');
        const linkCount = await processLinks.count();
        
        for (let i = 0; i < linkCount; i++) {
          const linkText = await processLinks.nth(i).innerText();
          // Normalize spaces for comparison (handle cases like "notepad .exe" vs "notepad.exe")
          const normalizedLink = linkText.trim().replace(/\s+/g, ' ');
          const normalizedSearch = processName.trim().replace(/\s+/g, ' ');
          
          // Debug: show items around the target
          const isNotepadRelated = normalizedSearch.toLowerCase().includes('notepad') || normalizedLink.toLowerCase().includes('notepad');
          if (isNotepadRelated) {
            const isCaseInsensitiveMatch = (normalizedLink.toLowerCase() === normalizedSearch.toLowerCase());
            const matchType = (normalizedLink === normalizedSearch) ? '✓ EXACT' : 
                            isCaseInsensitiveMatch ? '≈ case-diff' : '○';
            console.log(`  🔎 ${matchType}: "${linkText}" (normalized: "${normalizedLink}")`);
          }
          
          // Match case-insensitively so users can enter any capitalization
          if (normalizedLink.toLowerCase() === normalizedSearch.toLowerCase()) {
            console.log(`🎯 FOUND "${processName}" (actual: "${linkText}") on page ${currentPage}`);
            console.log(`📊 Total pages checked: ${currentPage} (exponential search with binary refinement)`);
            console.log('━'.repeat(60));
            
            await Promise.all([
              this.page.waitForLoadState('load', { timeout: 10000 }),
              processLinks.nth(i).click()
            ]);
            return;
          }
        }
        
        // Not found on this page
        console.log(`⚠️  Not found on page ${currentPage} - continuing search`);
        
        // Check if target is actually before this page's range
        const targetBeforeRange = this.compareProcessNames(processName, pageRange.firstItem) < 0;
        console.log(`🔍 DEBUG: targetBeforeRange=${targetBeforeRange}, scanReason=${scanReason}, firstItem="${pageRange.firstItem}"`);
        
        // If we scanned because target < firstItem but shared prefix, OR discovered target < firstItem after scanning
        if (scanReason === 'prefix-before' || targetBeforeRange) {
          // If this is page 1, we can't go backward, so go forward instead
          if (currentPage === 1) {
            console.log(`⏭️  Page 1 scanned - continuing forward`);
            lastValidPage = currentPage;
            // Continue to forward jump logic below
          } else {
            if (targetBeforeRange && scanReason !== 'prefix-before') {
              console.log(`⬅️  After scanning, target < firstItem - searching backward`);
            } else {
              console.log(`⬅️  Scanned due to prefix match but target < firstItem - searching backward`);
            }
            maxValidPage = currentPage - 1;
            
            // Check if binary search range exists
            if (lastValidPage >= maxValidPage) {
              console.log(`🛑 Binary search exhausted (${lastValidPage} >= ${maxValidPage})`);
              throw new Error(`${processName} not found - binary search exhausted`);
            }
            
            currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
            blockSize = 1;
            const pageLoaded = await this.goToPage(currentPage);
            if (!pageLoaded) {
              currentPage = lastValidPage + 1;
              await this.goToPage(currentPage);
            }
            continue;
          }
        } else if (scanReason === 'in-range' && currentPage - lastValidPage > 1) {
          // We scanned this page expecting to find the target, but didn't
          // If there's a gap between lastValidPage and currentPage, search it
          console.log(`⚠️  Expected to find target on page ${currentPage}, but didn't - checking gap`);
          maxValidPage = currentPage - 1;
          currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
          blockSize = 1;
          const pageLoaded = await this.goToPage(currentPage);
          if (!pageLoaded) {
            currentPage = lastValidPage + 1;
            await this.goToPage(currentPage);
          }
          continue;
        } else {
          // Otherwise target must be after this page
          lastValidPage = currentPage;
        }
        // Continue to the forward jump logic below
      }

      // Target is after this page - but if this is last page, scan it anyway
      if (pageRange.count < 50) {
        // This page has less than 50 items - it's likely the last page
        // Scan it even if target appears to be after last item
        console.log(`🔍 Last page detected (${pageRange.count} items) - scanning anyway`);
        
        const processLinks = this.page.locator('table tr td:nth-child(2) a');
        const linkCount = await processLinks.count();
        
        for (let i = 0; i < linkCount; i++) {
          const linkText = await processLinks.nth(i).innerText();
          // Normalize spaces for comparison
          const normalizedLink = linkText.trim().replace(/\s+/g, ' ');
          const normalizedSearch = processName.trim().replace(/\s+/g, ' ');
          
          if (normalizedLink.toLowerCase() === normalizedSearch.toLowerCase()) {
            console.log(`🎯 FOUND "${processName}" on page ${currentPage} (last page)`);
            console.log(`📊 Total pages checked: ${currentPage}`);
            console.log('━'.repeat(60));
            
            await Promise.all([
              this.page.waitForLoadState('load', { timeout: 10000 }),
              processLinks.nth(i).click()
            ]);
            return;
          }
        }
        
        // Not found even on last page
        console.log(`❌ Not found on last page - process doesn't exist`);
        throw new Error(`${processName} not found - checked through last page`);
      }

      // Target is after this page - jump forward
      lastValidPage = currentPage;
      
      // If we have an upper bound, do binary search
      if (maxValidPage !== null) {
        console.log(`⏭️  Binary search: target > "${pageRange.lastItem}" - searching between ${lastValidPage} and ${maxValidPage}`);
        currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
        blockSize = 1;
      } else {
        console.log(`⏭️  Target "${processName}" > "${pageRange.lastItem}" - jumping ${blockSize} pages`);
        currentPage += blockSize;
      }
      
      // Try to go to the new page
      const pageLoaded = await this.goToPage(currentPage);
      
      if (!pageLoaded) {
        // Page doesn't exist - we've gone past the last page
        // Update upper bound to try lower page
        console.log(`⬅️  Page ${currentPage} doesn't exist - updating upper bound`);
        maxValidPage = currentPage - 1;
        
        // Check if binary search range is exhausted
        if (lastValidPage >= maxValidPage) {
          console.log(`🛑 Binary search exhausted (${lastValidPage} >= ${maxValidPage})`);
          throw new Error(`${processName} not found - reached end of available pages`);
        }
        
        currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
        blockSize = 1;
        await this.goToPage(currentPage);
        continue;
      }
      
      // Increase block size exponentially (with cap) only if no upper bound
      if (maxValidPage === null && blockSize < maxBlockSize) {
        blockSize = Math.min(blockSize * 2, maxBlockSize);
      }
    }

    throw new Error(`${processName} not found after checking maximum ${maxPages} pages`);
  }

  async getPageRange() {
    // Extract first and last process names from the table
    // Table structure: Row#, Path, Product Name, Vendor, Version, Size, MD5
    // Process names are in column 2 (nth-child(2))
    
    // Wait for table content to be available
    try {
      await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 8000 });
    } catch (e) {
      // Debug: capture what's actually on the page
      const pageContent = await this.page.content();
      console.error('❌ Failed to find table content. Page HTML length:', pageContent.length);
      
      // Retry once after waiting longer
      console.log('⏳ Retrying after 2 seconds...');
      await this.page.waitForTimeout(2000);
      
      try {
        await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 8000 });
      } catch (e2) {
        // Still failed - return null
        return { firstItem: null, lastItem: null };
      }
    }
    
    const processLinks = this.page.locator('table tr td:nth-child(2) a');
    const count = await processLinks.count();
    
    if (count === 0) {
      return { firstItem: null, lastItem: null, count: 0 };
    }

    // Get first and last items by index to ensure we get actual process names
    const firstItem = await processLinks.nth(0).innerText();
    const lastItem = await processLinks.nth(count - 1).innerText();
    
    // Debug: log count for troubleshooting
    if (count > 0) {
      console.log(`  📋 Page has ${count} process links`);
    }
    
    // Debug: For troubleshooting sorting issues, log a few items
    if (count >= 10) {
      const item5 = await processLinks.nth(4).innerText();
      const item25 = count >= 25 ? await processLinks.nth(24).innerText() : null;
      const item45 = count >= 45 ? await processLinks.nth(44).innerText() : null;
      console.log(`  🔍 Sample items: [5]=${item5}, [25]=${item25}, [45]=${item45}`);
    }

    return {
      firstItem: firstItem.trim(),
      lastItem: lastItem.trim(),
      count: count
    };
  }

  compareProcessNames(target, reference) {
    // Custom comparison to match website's sorting:
    // - Strips special characters first
    // - Case-insensitive comparison
    // Simple and reliable
    
    const stripSpecial = (str) => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    const strippedTarget = stripSpecial(target);
    const strippedReference = stripSpecial(reference);
    
    // Debug logging for troubleshooting
    if (target.includes('googleearth') && reference.includes('google')) {
      console.log(`🔍 COMPARE DEBUG: "${target}" vs "${reference}"`);
      console.log(`   Stripped: "${strippedTarget}" vs "${strippedReference}"`);
      console.log(`   Result: ${strippedTarget < strippedReference ? -1 : strippedTarget > strippedReference ? 1 : 0}`);
    }
    
    if (strippedTarget < strippedReference) return -1;
    if (strippedTarget > strippedReference) return 1;
    return 0;
  }
}

module.exports = ProcessLibraryPage;
