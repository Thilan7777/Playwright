# Multi-Process Search Feature

## Overview
The Playwright process search app now supports searching for **multiple processes in one request**, with each process running in its own Chrome tab.

## Key Features

### ✅ What Was Added
1. **Multi-process input parsing**: Accepts comma or newline-separated process names
2. **Parallel tab execution**: Each process runs in a separate Chrome tab using `context.newPage()`
3. **Concurrency control**: Limits concurrent searches (default: 3 at a time) to prevent overload
4. **Individual results**: Each tab displays its own results page (no combined/summary output)
5. **Reuses existing logic**: The internal single-process search algorithm remains **completely unchanged**

### 🔒 What Was NOT Changed
- The existing single-process search algorithm (in `ProcessLibraryPage.openProcess()`)
- Page object selectors and navigation logic
- Results HTML rendering for individual processes
- Any internal search steps or pruning algorithms

## File Changes

### New Files
- **`utils/multi-process-runner.js`** - Core multi-process orchestrator
  - `parseProcessNames()` - Parses comma/newline-separated input
  - `createConcurrencyLimiter()` - Simple p-limit style concurrency control
  - `runSingleProcessSearch()` - Extracted single-process logic (reusable)
  - `displayResultsInTab()` - Shows results in dedicated tab
  - `runMultipleProcesses()` - Main orchestrator function

### Modified Files
- **`tests/process-search.spec.js`** 
  - Added multi-process detection after user input
  - Routes to multi-tab flow if multiple names detected
  - Preserves original single-process flow unchanged

- **`input-form.html`**
  - Updated placeholder text to indicate multi-process support
  - Added examples showing comma-separated input
  - Added hint about multiple tabs

## Usage

### Option 1: Via Input Form (Interactive)
1. Run the main test:
   ```powershell
   npx playwright test tests/process-search.spec.js --headed
   ```

2. In the input form, enter multiple process names:
   - **Comma-separated**: `chrome.exe, firefox.exe, notepad.exe`
   - **Newline-separated**: 
     ```
     chrome.exe
     firefox.exe
     notepad.exe
     ```

3. Click "Search Process" - multiple tabs will open, each with its own results

### Option 2: Custom Code
```javascript
const { runMultipleProcesses } = require('./utils/multi-process-runner');

test('My custom multi-search', async ({ browser }) => {
  const context = await browser.newContext();
  
  const processNames = ['chrome.exe', 'notepad.exe', 'cmd.exe'];
  const results = await runMultipleProcesses(context, processNames, 3);
  
  // Each result contains: processName, processFound, allData, searchTime, foundInfo
  results.forEach(result => {
    console.log(`${result.processName}: ${result.processFound ? 'FOUND' : 'NOT FOUND'}`);
  });
});
```

## How It Works

### Single Process (Existing Behavior)
```
User enters: "chrome.exe"
    ↓
Opens 1 tab with search results
    ↓
User can click "New Search" to search again
```

### Multiple Processes (New Behavior)
```
User enters: "chrome.exe, firefox.exe, notepad.exe"
    ↓
Parses into array: ['chrome.exe', 'firefox.exe', 'notepad.exe']
    ↓
Creates 3 tabs (context.newPage() for each)
    ↓
Runs existing single-process algorithm in each tab (concurrency: 3)
    ↓
Each tab shows its own results.html page
    ↓
All tabs remain open (user closes manually)
```

### Concurrency Control
- Default: 3 processes at a time
- Configurable: `runMultipleProcesses(context, names, 2)` for 2 at a time
- Prevents server overload and browser resource exhaustion
- Uses queue-based limiter (no external dependencies)

## Technical Details

### Architecture
```
input-form.html (user input)
    ↓
process-search.spec.js (detects single vs multi)
    ↓
    ├─ Single → Existing flow (unchanged)
    │
    └─ Multi → runMultipleProcesses()
              ↓
              For each process:
                1. context.newPage() → create tab
                2. runSingleProcessSearch(page, name) → reuses existing logic
                3. displayResultsInTab(page, results) → show results
                4. Keep tab open
```

### Key Functions

#### `parseProcessNames(input: string): string[]`
Parses multi-line or comma-separated input into clean array of process names.
- Handles: `"chrome.exe, firefox.exe"` → `['chrome.exe', 'firefox.exe']`
- Handles: `"chrome.exe\nfirefox.exe"` → `['chrome.exe', 'firefox.exe']`
- Trims whitespace, ignores empty values

#### `runMultipleProcesses(context, processNames, concurrency=3): Promise<results[]>`
Main orchestrator - creates tabs and runs searches with concurrency control.
- **Input**: Browser context, array of process names, concurrency limit
- **Output**: Array of results (one per process)
- **Behavior**: Keeps all tabs open after completion

#### `runSingleProcessSearch(page, processName, index): Promise<result>`
Extracted single-process search logic - runs in a given page.
- Uses existing HomePage, ProcessLibraryPage, ProcessDetailsPage
- **Does NOT modify** any internal search algorithms or selectors
- Returns: `{ processName, processFound, allData, searchTime, foundInfo, index }`

## Examples

### Example 1: Search Multiple Known Processes
```javascript
const { runMultipleProcesses } = require('./utils/multi-process-runner');

const context = await browser.newContext();
const results = await runMultipleProcesses(context, [
  'chrome.exe',
  'firefox.exe',
  'notepad.exe'
], 3);

// Results:
// Tab 1: chrome.exe results
// Tab 2: firefox.exe results  
// Tab 3: notepad.exe results
```

### Example 2: With Concurrency Control
```javascript
// Search 10 processes, but only 2 at a time
const results = await runMultipleProcesses(context, [
  'p1.exe', 'p2.exe', 'p3.exe', 'p4.exe', 'p5.exe',
  'p6.exe', 'p7.exe', 'p8.exe', 'p9.exe', 'p10.exe'
], 2);

// Execution order:
// [p1, p2] → [p3, p4] → [p5, p6] → [p7, p8] → [p9, p10]
//    ↓         ↓          ↓          ↓          ↓
//  Tab 1-2   Tab 3-4    Tab 5-6    Tab 7-8    Tab 9-10
```

### Example 3: Input Form with Multiple Names
Enter in the input form:
```
chrome.exe, firefox.exe, notepad.exe
```

Or:
```
chrome.exe
firefox.exe
notepad.exe
```

Both will create 3 separate tabs with individual results.

## Testing

### Run Main Test (with user input)
```powershell
npx playwright test tests/process-search.spec.js --headed
```
- Enter multiple names in the form to trigger multi-process mode
- Enter single name to use original single-process mode

## Performance Notes

- **Concurrency**: Default limit of 3 prevents overwhelming the server
- **Memory**: Each tab consumes browser resources - adjust concurrency for large batches
- **Network**: Searches run in parallel (respecting concurrency limit)
- **UI**: Each tab remains open until manually closed by user

## Backward Compatibility

✅ **Fully backward compatible**
- Single-process input works exactly as before
- Existing tests and workflows unchanged
- No breaking changes to page objects or selectors
- Can still use "New Search" button for repeated single searches

## Limitations

- Multi-process mode is "one-shot" - doesn't support "New Search" loop
- Tabs must be manually closed by user (not auto-closed)
- No combined summary view - each tab shows individual results only
- Concurrency control is basic (queue-based, not adaptive)

## Future Enhancements (Optional)

- [ ] Auto-close tabs after a timeout
- [ ] Summary dashboard showing all results in one view
- [ ] Export all results to CSV/JSON
- [ ] Adaptive concurrency based on system resources
- [ ] Resume failed searches
- [ ] Progress indicator for multi-process searches
