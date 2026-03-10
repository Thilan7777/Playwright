class ProcessDetailsPage {
  constructor(page) {
    this.page = page;
  }

  async getFilePath() {
    // Wait for the page to load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Find the Path column in the table (2nd cell in the first data row after header)
    // The table has columns: Row#, Path, Product Name, Vendor, Version, Size, MD5
    const filePath = await this.page.locator('table tr:has-text("Path") + tr td:nth-child(2)').innerText();
    return filePath.trim();
  }

  async getFilePathAndProductName() {
    // Wait for the page to load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Get the first data row (row after the header row)
    // Table structure: Row#, Path, Product Name, Vendor, Version, Size, MD5
    const firstDataRow = this.page.locator('table tr:has-text("Path") + tr').first();
    
    // Extract Path (2nd column - after row number)
    const filePath = await firstDataRow.locator('td:nth-child(2)').innerText();
    
    // Extract Product Name (3rd column)
    const productName = await firstDataRow.locator('td:nth-child(3)').innerText();
    
    return {
      path: filePath.trim(),
      productName: productName.trim()
    };
  }

  async getAllFilePathsData() {
    // Wait for the page to load (use domcontentloaded for faster response)
    await this.page.waitForLoadState('domcontentloaded');
    
    // Wait for table to be visible with shorter timeout
    await this.page.waitForSelector('table', { state: 'visible', timeout: 2000 });
    
    // Extract all data in a single browser-side operation (MUCH faster)
    const allData = await this.page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tr'));
      const dataRows = [];
      
      // Skip header row (first row)
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        
        if (cells.length >= 7) {
          const path = cells[1].innerText.trim();
          
          // Only add rows that have actual path data
          if (path) {
            dataRows.push({
              rowNum: cells[0].innerText.trim(),
              path: path,
              productName: cells[2].innerText.trim(),
              vendor: cells[3].innerText.trim(),
              version: cells[4].innerText.trim(),
              size: cells[5].innerText.trim(),
              md5: cells[6].innerText.trim()
            });
          }
        }
      }
      
      return dataRows;
    });
    
    console.log(`📊 Total rows found in table: ${allData.length + 1} (including header)`);
    console.log(`📦 Total data rows extracted: ${allData.length}\n`);
    
    // Log first few and last few rows for verification
    if (allData.length > 0) {
      console.log(`  ✓ First row: ${allData[0].path}`);
      if (allData.length > 1) {
        console.log(`  ✓ Last row: ${allData[allData.length - 1].path}`);
      }
    }
    
    return allData;
  }
}

module.exports = ProcessDetailsPage;
