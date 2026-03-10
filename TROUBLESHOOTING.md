# Analytics Loading Issue - Troubleshooting Guide

## Problem: Analytics page stuck in loading state

### Quick Fix Steps:

1. **Open Browser Console (F12)**
   - In Chrome/Edge: Press `F12` or right-click → Inspect → Console tab
   - Look for error messages in red

2. **Check the Console Output**
   When you click "View Analytics", you should see these messages:
   ```
   openAnalytics() called
   resultsData: {processName: "...", data: [...]}
   Data validation passed. Total candidates: X
   Storing data in localStorage...
   Data stored successfully
   Opening analytics window...
   Analytics window opened successfully
   ```

   In the analytics window, you should see:
   ```
   Analytics page loaded
   AnalyticsScoring available: true
   Setting up DOMContentLoaded listener...
   DOM loaded, calling displayAnalytics...
   displayAnalytics() called
   Loading analytics data...
   Raw data: {...}
   Converting data format...
   Candidates prepared: X
   Running analytics...
   Analytics complete: {...}
   Displaying analytics content...
   Analytics display complete!
   ```

### Common Issues & Solutions:

#### Issue 1: "scoring.js failed to load"
**Console shows:** `AnalyticsScoring available: false`

**Solution:**
- Verify file `utils/scoring.js` exists
- Check file path is correct
- Try opening: `file:///C:/Users/Admin/Documents/Playwright/utils/scoring.js` directly

#### Issue 2: "No data available"
**Console shows:** `Raw data: null`

**Solution:**
- Make sure you clicked "View Analytics" from results.html (not directly opening analytics.html)
- Check localStorage: In console, type: `localStorage.getItem('analyticsData')`
- If null, there's an issue storing data

#### Issue 3: JavaScript error in console
**Console shows:** Red error messages

**Solution:**
- Copy the exact error message
- Check if it mentions a missing function or undefined variable
- Most likely a typo or missing function in scoring.js

#### Issue 4: Loading forever (no console errors)
**Console shows:** Nothing after "DOM loaded"

**Solution:**
- displayAnalytics() might not be called
- Try manually: Open console and type: `displayAnalytics()`
- Check if DOMContentLoaded event fired

### Testing Procedure:

1. **Test scoring.js directly:**
   - Open `verify-analytics.html` in browser
   - Should show all green checkmarks
   - If any red, the problem is in scoring.js

2. **Test with sample data:**
   - Open `test-analytics.html`
   - Click "Load Sample Data & View Analytics"
   - Should work immediately (bypasses real data issues)

3. **Test with real data:**
   - Run your Playwright test
   - Open results.html
   - Click "View Analytics"
   - Check console for error messages

### Manual Data Check:

Open browser console and paste this:
```javascript
// Check if data exists
const data = localStorage.getItem('analyticsData');
console.log('Data exists:', data !== null);
console.log('Data length:', data ? data.length : 0);

// Try to parse it
if (data) {
    try {
        const parsed = JSON.parse(data);
        console.log('Process name:', parsed.processName);
        console.log('Total results:', parsed.data.length);
        console.log('First item:', parsed.data[0]);
    } catch (e) {
        console.error('Parse error:', e);
    }
}

// Check scoring module
console.log('AnalyticsScoring exists:', typeof window.AnalyticsScoring !== 'undefined');
if (typeof window.AnalyticsScoring !== 'undefined') {
    console.log('Functions available:', Object.keys(window.AnalyticsScoring));
}
```

### File Path Issues (Windows):

If using local file:// protocol:
- Paths like `utils/scoring.js` might not work
- Try absolute path: `<script src="file:///C:/Users/Admin/Documents/Playwright/utils/scoring.js"></script>`
- **Better:** Use a local web server (see below)

### Recommended: Use Local Web Server

Instead of opening files directly with `file://`, run a local server:

**Option 1: Python**
```bash
cd C:\Users\Admin\Documents\Playwright
python -m http.server 8000
```
Then open: `http://localhost:8000/results.html`

**Option 2: Node.js**
```bash
npx http-server
```

**Option 3: VS Code**
- Install "Live Server" extension
- Right-click `results.html` → Open with Live Server

### Still Not Working?

1. Clear browser cache and localStorage:
   ```javascript
   localStorage.clear();
   location.reload();
   ```

2. Check all files exist:
   - analytics.html
   - results.html
   - utils/scoring.js

3. Check file permissions (should be readable)

4. Try different browser (Chrome, Edge, Firefox)

5. Share console output for further debugging

---

## Expected Flow:

```
results.html (click button)
    ↓
Store data to localStorage
    ↓
Open analytics.html in new tab
    ↓
Load scoring.js
    ↓
DOMContentLoaded fires
    ↓
displayAnalytics() called
    ↓
Retrieve data from localStorage
    ↓
Run analyzeResults()
    ↓
Display categorized results
    ↓
Hide loading, show content
```

Any break in this chain will cause loading to hang.
Check console to see where it stops!
