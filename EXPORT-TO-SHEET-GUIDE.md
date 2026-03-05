# Export to Google Sheet - Quick Setup

## What This Does

Now you have an **"📤 Export"** button next to the Copy button on the analytics page that automatically sends the best candidate file path to your Google Sheet in Column F.

## Setup (One-Time)

### 1. Install Required Packages
```bash
npm install
```

This installs `express` and `cors` based on updated `package.json`.

### 2. Verify Google Sheet is Shared

Make sure your service account email has Editor access:
- Service account: `thilan@example-bucket-471905.iam.gserviceaccount.com`
- Check you shared the sheet with this email
- See `GOOGLE-SHEETS-VERIFICATION.md` for details

## Usage

### Step 1: Start the Export Server
Open a terminal and run:
```bash
node utils/export-server.js
```

You should see:
```
🚀 Export Server running on http://localhost:3000
📝 Open analytics.html and click the "📤 Export" button to send data to Google Sheets
```

### Step 2: Open Analytics Page & Click Export
1. Run your Playwright test to generate search results
2. Click "📊 View Analytics" button
3. Look at the **Best Candidate** section
4. Click the **"📤 Export"** button next to the path

### Step 3: Watch It Export
The button will show:
- `⏳ Exporting...` (while sending)
- `✅ Exported!` (success)
- `❌ Failed` (if error)

Then check your Google Sheet - the path will appear in **Column F** next!

## How It Works

```
Analytics Page 
    ↓
[📤 Export] button clicked
    ↓
Sends request to localhost:3000
    ↓
export-server.js receives request
    ↓
Calls google-sheets-integration.js
    ↓
Data appended to Google Sheet Column F
```

## Troubleshooting

### Server won't start
```bash
# Check if port 3000 is already in use
# Stop other processes or use different port in export-server.js
node utils/export-server.js
```

### Export button fails
1. Check server terminal for errors
2. Verify service account is shared with Editor permissions
3. Check browser console (F12) for error details

### "Could not connect to server"
- Make sure `node utils/export-server.js` is running
- Check it says "Server running on http://localhost:3000"
- Try clicking Export again

## Running Both Together

For maximum efficiency:

**Terminal 1** - Start export server:
```bash
node utils/export-server.js
```

**Terminal 2** - Run your tests:
```bash
npx playwright test
```

Then:
1. View analytics
2. Click Export → data goes to sheet automatically
3. No need to switch windows or run commands!

## Features

✅ One-click export from analytics page  
✅ Shows status while exporting  
✅ Automatic next-empty-row detection  
✅ Works with your existing Google Sheet setup  
✅ Respects all permissions & credentials  

## Advanced

To change column, edit `utils/google-sheets-integration.js`:
```javascript
const TARGET_COLUMN = 'F';  // Change to G, H, etc.
```

To use different port, edit `export-server.js` and `analytics.html`:
```javascript
const PORT = 4000;  // Change in both files
fetch('http://localhost:4000/export-to-sheets',  // Update here too
```

---

**Ready to use?** Start the server and try exporting! 🚀
