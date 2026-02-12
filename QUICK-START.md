# Quick Start: Multi-Process Search

## 🎯 How to Use

### How to Use
```powershell
npx playwright test tests/process-search.spec.js --headed
```

When the form appears, enter multiple process names:
- **Comma**: `chrome.exe, firefox.exe, notepad.exe`
- **Newline**: Press Enter between each name
- **Mixed**: Both separators work together

Click "Search Process" → Multiple tabs will open, each showing results for one process.

### Test the Parsing Utility
```powershell
node tests/test-utilities.js
```

## 📁 What Was Changed

### New Files
1. **`utils/multi-process-runner.js`** - Core orchestration logic
   - Parses multi-process input
   - Manages concurrency (3 tabs at a time by default)
   - Runs existing single-process algorithm in each tab

2. **`tests/test-utilities.js`** - Unit tests for parsing function

3. **`MULTI-PROCESS-FEATURE.md`** - Complete documentation

### Modified Files
1. **`tests/process-search.spec.js`** (minimal changes)
   - Added import for multi-process utilities
   - Added detection for multiple process names after user input
   - Routes to multi-tab flow if multiple names detected
   - **Preserves original single-process flow unchanged**

2. **`input-form.html`** (UI hints only)
   - Updated placeholder and hint text
   - Added examples showing comma-separated input

### Unchanged Files (Existing Logic Preserved)
- ✅ `pages/HomePage.js` - No changes
- ✅ `pages/ProcessLibraryPage.js` - **No changes to search algorithm**
- ✅ `pages/ProcessDetailsPage.js` - No changes
- ✅ `results.html` - No changes
- ✅ All existing selectors, navigation logic, and search algorithms preserved

## 🚀 Examples

### Example 1: Search 3 Processes
Input:
```
chrome.exe, firefox.exe, notepad.exe
```

Result:
- 3 tabs open
- Each tab shows results for one process
- Tabs stay open until manually closed

### Example 2: With Newlines
Input:
```
chrome.exe
firefox.exe  
notepad.exe
```

Result: Same as Example 1

### Example 3: Single Process (Original Behavior)
Input:
```
chrome.exe
```

Result:
- Opens 1 result page
- Can click "New Search" for another search
- Original single-process flow unchanged

## 🔧 Customization

### Change Concurrency Limit
Edit [process-search.spec.js](tests/process-search.spec.js#L78):
```javascript
// Default: 3 tabs at a time
await runMultipleProcesses(multiContext, processNames, 3);

// Change to 2 tabs at a time
await runMultipleProcesses(multiContext, processNames, 2);

// Change to 5 tabs at a time
await runMultipleProcesses(multiContext, processNames, 5);
```

### Programmatic Usage
```javascript
const { runMultipleProcesses, parseProcessNames } = require('./utils/multi-process-runner');

// Parse input
const names = parseProcessNames('chrome.exe, firefox.exe');

// Run searches
const context = await browser.newContext();
const results = await runMultipleProcesses(context, names, 3);

// Check results
results.forEach(r => {
  console.log(`${r.processName}: ${r.processFound ? 'FOUND' : 'NOT FOUND'}`);
  console.log(`  Time: ${r.searchTime}`);
  console.log(`  Results: ${r.allData.length}`);
});
```

## ✅ Testing

```powershell
# Test parsing utility
node tests/test-utilities.js

# Run main test with user input
npx playwright test tests/process-search.spec.js --headed

# Run demo (no user input needed)
## 📊 Key Features

✅ **Multi-process support** - Search multiple processes in one request  
✅ **Separate tabs** - Each process gets its own Chrome tab  
✅ **Concurrency control** - Limit concurrent tabs (default: 3)  
✅ **Input parsing** - Supports comma and newline separators  
✅ **Reuses existing logic** - No changes to single-process search algorithm  
✅ **Backward compatible** - Single-process searches work exactly as before  
✅ **Individual results** - Each tab shows its own results.html page  

## 🎓 Architecture

```
User Input: "chrome.exe, firefox.exe"
        ↓
parseProcessNames() → ['chrome.exe', 'firefox.exe']
        ↓
runMultipleProcesses(context, processNames, concurrency=3)
        ↓
For each process:
  - context.newPage() → Create new tab
  - runSingleProcessSearch(page, processName) → Run existing algorithm
  - displayResultsInTab(page, results) → Show results
        ↓
All tabs remain open with individual results
```

## 📝 Notes

- **Concurrency**: Default limit of 3 prevents server overload
- **Tabs**: Each tab stays open until manually closed
- **Memory**: More processes = more browser resources
- **Single vs Multi**: Automatically detected based on input
- **No Breaking Changes**: Existing tests and workflows continue to work

## 🐛 Troubleshooting

**Issue**: Tabs aren't opening  
**Solution**: Check console logs - look for parsing output showing process names detected

**Issue**: Getting errors about module not found  
**Solution**: Ensure `utils/multi-process-runner.js` exists

**Issue**: Want to auto-close tabs  
**Solution**: Modify `runMultipleProcesses()` to add `await page.close()` after displaying results

**Issue**: Need more/fewer concurrent tabs  
**Solution**: Change the concurrency parameter (third argument to `runMultipleProcesses()`)

## 📚 Further Reading

See [MULTI-PROCESS-FEATURE.md](MULTI-PROCESS-FEATURE.md) for complete documentation including:
- Detailed architecture
- Technical implementation details
- API reference
- Performance notes
- Future enhancement ideas
