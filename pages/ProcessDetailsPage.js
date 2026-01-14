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
    // Wait for the page to load (faster load state)
    await this.page.waitForLoadState('load');
    
    // Wait for table to be visible with shorter timeout
    await this.page.waitForSelector('table', { state: 'visible', timeout: 3000 });
    
    // Get all data rows (all tr elements inside tbody, or all rows except header)
    // First, let's find all rows in the table
    const allRows = this.page.locator('table tr');
    const totalRows = await allRows.count();
    
    console.log(`📊 Total rows found in table: ${totalRows}`);
    
    const allData = [];
    
    // Skip the first row (header) and process all data rows
    for (let i = 1; i < totalRows; i++) {
      const row = allRows.nth(i);
      
      // Check if this row has enough columns (should have at least 7 td elements)
      const cells = row.locator('td');
      const cellCount = await cells.count();
      
      if (cellCount >= 7) {
        // Extract all columns
        const rowNum = await cells.nth(0).innerText().catch(() => '');
        const path = await cells.nth(1).innerText().catch(() => '');
        const productName = await cells.nth(2).innerText().catch(() => '');
        const vendor = await cells.nth(3).innerText().catch(() => '');
        const version = await cells.nth(4).innerText().catch(() => '');
        const size = await cells.nth(5).innerText().catch(() => '');
        const md5 = await cells.nth(6).innerText().catch(() => '');
        
        // Only add rows that have actual path data
        if (path.trim()) {
          allData.push({
            rowNum: rowNum.trim(),
            path: path.trim(),
            productName: productName.trim(),
            vendor: vendor.trim(),
            version: version.trim(),
            size: size.trim(),
            md5: md5.trim()
          });
          console.log(`  ✓ Row ${allData.length}: ${path.trim()}`);
        }
      }
    }
    
    console.log(`📦 Total data rows extracted: ${allData.length}\n`);
    
    return allData;
  }
}

module.exports = ProcessDetailsPage;
