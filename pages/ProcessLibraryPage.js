class ProcessLibraryPage {
  constructor(page) {
    this.page = page;
  }

  async selectLetter(letter) {
    // Click on the letter link (e.g., A, B, C, etc.)
    // The letters are links with URLs like file.php?start=S
    await this.page.locator(`a[href*="file.php?start=${letter.toUpperCase().trim()}"]`).click();
    
    // Wait for page to fully load
    await this.page.waitForLoadState('domcontentloaded', { timeout: 8000 });
    
    // Wait for table to be visible
    await this.page.waitForSelector('table', { timeout: 8000 });
    
    // Wait for actual table content (process links) to appear
    await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 8000 });
    
    // Wait a bit for any loading overlays/dialogs to disappear
    await this.page.waitForTimeout(200);
    
    // Store the base URL for this letter (for direct page navigation)
    this.baseUrl = this.page.url();
    console.log(`🔤 Selected letter "${letter}" - URL: ${this.baseUrl}`);
    
    // Check if URL already has a page parameter
    const urlObj = new URL(this.baseUrl);
    const currentPageParam = urlObj.searchParams.get('page');
    console.log(`📄 Current page parameter: ${currentPageParam || 'none (implies page 0 or 1)'}`);
  }

  async goToPage(pageNum) {
    // Direct URL navigation to a specific page - much faster than clicking
    const url = `${this.baseUrl}&page=${pageNum}`;
    
    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 8000 });
      
      // Wait for table to load
      await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 8000 });
      
      // Small delay to ensure page is fully rendered
      await this.page.waitForTimeout(50);
      
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
    
    // Start from page 0 since that's typically the first page after selecting a letter
    let currentPage = 0;
    let blockSize = 8;
    let lastValidPage = 0;
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
          // Even the midpoint doesn't exist, try next page after last valid
          currentPage = lastValidPage + 1;
          const retryLoaded = await this.goToPage(currentPage);
          if (!retryLoaded) {
            throw new Error(`${processName} not found - no valid pages after ${lastValidPage}`);
          }
        }
        continue;
      }

      console.log(`📍 Page ${currentPage}: [${pageRange.firstItem}] → [${pageRange.lastItem}] (block=${blockSize})`);

      // Debug: If this is page 126 or 1009, log all items
      if (currentPage === 126 || currentPage === 1009) {
        const processLinks = this.page.locator('table tr td:nth-child(2) a');
        const count = await processLinks.count();
        console.log(`🔍 DEBUG Page ${currentPage} - Total items: ${count}`);
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
      // Use 3-character prefix for better precision
      const targetPrefix3 = processName.trim().toLowerCase().substring(0, 3);
      const firstPrefix3 = pageRange.firstItem.trim().toLowerCase().substring(0, 3);
      const sharesFirstPrefix = targetPrefix3 === firstPrefix3 || (targetPrefix3.length >= 2 && firstPrefix3.length >= 2 && targetPrefix3.substring(0, 2) === firstPrefix3.substring(0, 2));
      
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
          console.log(`⚠️  Binary search range collapsed (${lastValidPage} >= ${maxValidPage}) - scanning final pages`);
          
          // Before giving up, scan the boundary pages
          const pagesToCheck = new Set([lastValidPage, maxValidPage, lastValidPage + 1]);
          for (const pageNum of pagesToCheck) {
            if (pageNum <= 0 || scannedPages.has(pageNum)) continue;
            
            console.log(`🔍 Final boundary check on page ${pageNum}`);
            const scanLoaded = await this.goToPage(pageNum);
            if (!scanLoaded) continue;
            
            scannedPages.add(pageNum);
            
            const processLinks = this.page.locator('table tr td:nth-child(2) a');
            const linkCount = await processLinks.count();
            
            for (let i = 0; i < linkCount; i++) {
              const linkText = await processLinks.nth(i).innerText();
              const normalizedLink = linkText.trim().replace(/\s+/g, ' ');
              const normalizedSearch = processName.trim().replace(/\s+/g, ' ');
              
              if (normalizedLink.toLowerCase() === normalizedSearch.toLowerCase()) {
                console.log(`🎯 FOUND "${processName}" on page ${pageNum} (boundary check)`);
                console.log('━'.repeat(60));
                
                await Promise.all([
                  this.page.waitForLoadState('domcontentloaded', { timeout: 8000 }),
                  processLinks.nth(i).click()
                ]);
                return;
              }
            }
          }
          
          console.log(`🛑 Binary search exhausted after scanning ${Array.from(pagesToCheck).join(', ')}`);
          throw new Error(`${processName} not found - binary search exhausted`);
        }
        
        currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
        blockSize = 1;
        
        const pageLoaded = await this.goToPage(currentPage);
        if (!pageLoaded) {
          currentPage = lastValidPage + 1;
          const retryLoaded = await this.goToPage(currentPage);
          if (!retryLoaded) {
            throw new Error(`${processName} not found - no valid pages after ${lastValidPage}`);
          }
        }
        continue;
      }

      // Target is within this page range - scan it
      // Also scan if target has same prefix as last item OR first item (safety check for sorting edge cases)
      const lastPrefix3 = pageRange.lastItem.trim().toLowerCase().substring(0, 3);
      const comparisonResult = this.compareProcessNames(processName, pageRange.lastItem);
      const sharesLastPrefix = targetPrefix3 === lastPrefix3 || (targetPrefix3.length >= 2 && lastPrefix3.length >= 2 && targetPrefix3.substring(0, 2) === lastPrefix3.substring(0, 2));
      // Always scan if in binary search mode (blockSize == 1) or if prefix matches or if target is in range
      const shouldScan = comparisonResult <= 0 || 
                         sharesLastPrefix ||
                         sharesFirstPrefix ||
                         blockSize === 1;
      
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
          console.log(`✅ Target < firstItem but shares prefix "${targetPrefix3}" - SCANNING page ${currentPage}`);
          scanReason = 'prefix-before';
        } else if (sharesLastPrefix && comparisonResult > 0) {
          console.log(`✅ Target > lastItem but shares prefix "${targetPrefix3}" - SCANNING page ${currentPage}`);
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
        const targetAfterRange = this.compareProcessNames(processName, pageRange.lastItem) > 0;
        console.log(`🔍 DEBUG: targetBeforeRange=${targetBeforeRange}, targetAfterRange=${targetAfterRange}, scanReason=${scanReason}`);
        
        // If target is after the last item, continue forward
        if (targetAfterRange) {
          console.log(`⏭️  Target > lastItem "${pageRange.lastItem}" - continuing forward`);
          lastValidPage = currentPage;
          // Continue to forward jump logic below
        }
        // If we scanned because target < firstItem but shared prefix, OR discovered target < firstItem after scanning
        else if (scanReason === 'prefix-before' || targetBeforeRange) {
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
              console.log(`⚠️  Binary search range collapsed (${lastValidPage} >= ${maxValidPage}) - scanning boundary pages`);
              
              // Scan the boundary pages before giving up
              const pagesToCheck = new Set([lastValidPage, maxValidPage, currentPage]);
              for (const pageNum of pagesToCheck) {
                if (pageNum <= 0 || scannedPages.has(pageNum)) continue;
                
                console.log(`🔍 Backward boundary check on page ${pageNum}`);
                const scanLoaded = await this.goToPage(pageNum);
                if (!scanLoaded) continue;
                
                scannedPages.add(pageNum);
                
                const processLinks = this.page.locator('table tr td:nth-child(2) a');
                const linkCount = await processLinks.count();
                
                for (let i = 0; i < linkCount; i++) {
                  const linkText = await processLinks.nth(i).innerText();
                  const normalizedLink = linkText.trim().replace(/\s+/g, ' ');
                  const normalizedSearch = processName.trim().replace(/\s+/g, ' ');
                  
                  if (normalizedLink.toLowerCase() === normalizedSearch.toLowerCase()) {
                    console.log(`🎯 FOUND "${processName}" on page ${pageNum} (backward boundary)`);
                    console.log('━'.repeat(60));
                    
                    await Promise.all([
                      this.page.waitForLoadState('domcontentloaded', { timeout: 8000 }),
                      processLinks.nth(i).click()
                    ]);
                    return;
                  }
                }
              }
              
              console.log(`🛑 Binary search exhausted after scanning backward boundaries`);
              throw new Error(`${processName} not found - binary search exhausted`);
            }
            
            currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
            blockSize = 1;
            const pageLoaded = await this.goToPage(currentPage);
            if (!pageLoaded) {
              currentPage = lastValidPage + 1;
              const retryLoaded = await this.goToPage(currentPage);
              if (!retryLoaded) {
                throw new Error(`${processName} not found - no valid pages after ${lastValidPage}`);
              }
            }
            continue;
          }
        } else if (scanReason === 'in-range' && currentPage - lastValidPage > 1) {
          // We scanned this page expecting to find the target, but didn't
          // If there's a gap between lastValidPage and currentPage, search it
          const gapSize = currentPage - lastValidPage - 1;
          console.log(`⚠️  Expected to find target on page ${currentPage}, but didn't - checking gap of ${gapSize} pages`);
          maxValidPage = currentPage - 1;
          
          // If gap is small (<= 20 pages), scan sequentially from lastValidPage+1
          if (gapSize <= 20) {
            console.log(`📖 Small gap detected - sequential scan from page ${lastValidPage + 1}`);
            currentPage = lastValidPage + 1;
          } else {
            currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
          }
          blockSize = 1;
          const pageLoaded = await this.goToPage(currentPage);
          if (!pageLoaded) {
            currentPage = lastValidPage + 1;
            const retryLoaded = await this.goToPage(currentPage);
            if (!retryLoaded) {
              throw new Error(`${processName} not found - no valid pages after ${lastValidPage}`);
            }
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
        
        // If the gap is small (<=20 pages), scan sequentially instead of binary search
        if (maxValidPage - lastValidPage <= 20) {
          console.log(`📖 Gap is small (${maxValidPage - lastValidPage} pages) - sequential scan`);
          currentPage = lastValidPage + 1;
        } else {
          currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
        }
        blockSize = 1;
      } else {
        console.log(`⏭️  Target "${processName}" > "${pageRange.lastItem}" - jumping ${blockSize} pages`);
        currentPage += blockSize;
      }
      
      // Try to go to the new page
      const pageLoaded = await this.goToPage(currentPage);
      
      if (!pageLoaded) {
        // Page doesn't exist - we've gone past the last page
        // Use smart binary search: jump back quickly, only scan when needed
        console.log(`⬅️  Page ${currentPage} doesn't exist - fast backward search from ${lastValidPage}`);

        if (maxValidPage === null || currentPage - 1 < maxValidPage) {
          maxValidPage = currentPage - 1;
        }

        if (maxValidPage <= lastValidPage) {
          console.log(`🛑 Search exhausted (${lastValidPage} >= ${maxValidPage})`);
          throw new Error(`${processName} not found - reached end of available pages`);
        }

        // Binary search with smart scanning
        while (lastValidPage < maxValidPage) {
          currentPage = Math.floor((lastValidPage + maxValidPage) / 2);
          if (currentPage === lastValidPage) {
            currentPage = lastValidPage + 1;
          }
          
          const midLoaded = await this.goToPage(currentPage);
          if (!midLoaded) {
            // Page doesn't exist, move left
            maxValidPage = currentPage - 1;
            continue;
          }
          
          const midRange = await this.getPageRange();
          if (!midRange.firstItem) {
            maxValidPage = currentPage - 1;
            continue;
          }
          
          const compFirst = this.compareProcessNames(processName, midRange.firstItem);
          const compLast = this.compareProcessNames(processName, midRange.lastItem);
          
          console.log(`🔍 Binary check page ${currentPage}: [${midRange.firstItem}] → [${midRange.lastItem}]`);
          
          // Always scan the page to avoid missing targets
          const processLinks = this.page.locator('table tr td:nth-child(2) a');
          const linkCount = await processLinks.count();
          
          for (let i = 0; i < linkCount; i++) {
            const linkText = await processLinks.nth(i).innerText();
            const normalizedLink = linkText.trim().replace(/\s+/g, ' ');
            const normalizedSearch = processName.trim().replace(/\s+/g, ' ');
            
            if (normalizedLink.toLowerCase() === normalizedSearch.toLowerCase()) {
              console.log(`🎯 FOUND "${processName}" on page ${currentPage}`);
              console.log('━'.repeat(60));
              
              await Promise.all([
                this.page.waitForLoadState('domcontentloaded', { timeout: 8000 }),
                processLinks.nth(i).click()
              ]);
              return;
            }
          }
          
          // Not found, use comparison to narrow range
          if (compLast < 0) {
            // Target is before this page
            maxValidPage = currentPage - 1;
          } else {
            // Target is after this page
            lastValidPage = currentPage;
          }
        }
        
        // Binary search converged - scan the final pages to confirm
        console.log(`📍 Binary search converged at page ${lastValidPage}-${maxValidPage}`);
        
        const pagesToScan = [lastValidPage, lastValidPage + 1, maxValidPage];
        for (const pageNum of pagesToScan) {
          if (pageNum <= 0 || pageNum > lastValidPage + 10) continue;
          
          console.log(`🔎 Final check on page ${pageNum}`);
          const scanLoaded = await this.goToPage(pageNum);
          if (!scanLoaded) continue;
          
          const scanRange = await this.getPageRange();
          if (!scanRange.firstItem) continue;
          
          const processLinks = this.page.locator('table tr td:nth-child(2) a');
          const linkCount = await processLinks.count();
          
          for (let i = 0; i < linkCount; i++) {
            const linkText = await processLinks.nth(i).innerText();
            const normalizedLink = linkText.trim().replace(/\s+/g, ' ');
            const normalizedSearch = processName.trim().replace(/\s+/g, ' ');
            
            if (normalizedLink.toLowerCase() === normalizedSearch.toLowerCase()) {
              console.log(`🎯 FOUND "${processName}" on page ${pageNum} (final check)`);
              console.log('━'.repeat(60));
              
              await Promise.all([
                this.page.waitForLoadState('domcontentloaded', { timeout: 8000 }),
                processLinks.nth(i).click()
              ]);
              return;
            }
          }
        }
        
        console.log(`� Process not found in binary search range [${lastValidPage}-${maxValidPage}]`);
        console.log(`📍 Resuming exponential search from page ${maxValidPage}`);
        
        // Resume exponential search from maxValidPage
        currentPage = maxValidPage;
        maxValidPage = null; // Reset upper bound
        continue; // Continue the main loop
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
      await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 5000 });
    } catch (e) {
      console.error('❌ Failed to find table content. Retrying...');
      
      // Retry once after a short wait
      await this.page.waitForTimeout(500);
      
      try {
        await this.page.waitForSelector('table tr td:nth-child(2) a', { timeout: 5000 });
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
    // Match the website's sorting: case-insensitive, direct string comparison
    // DO NOT strip special characters for navigation comparison
    const targetLower = target.trim().toLowerCase();
    const referenceLower = reference.trim().toLowerCase();
    
    if (targetLower < referenceLower) return -1;
    if (targetLower > referenceLower) return 1;
    return 0;
  }
}

module.exports = ProcessLibraryPage;
