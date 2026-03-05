/**
 * Export Server - Express middleware for Google Sheets exports
 * Handles requests from analytics.html and exports to Google Sheets
 * 
 * Start the server:
 *   node utils/export-server.js
 * 
 * Then open analytics.html and click Export buttons
 */

const express = require('express');
const cors = require('cors');
const { appendToSheet, appendBestCandidatePath, appendProductName } = require('./google-sheets-integration');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'Server running', port: PORT });
});

/**
 * Export endpoint - handles both filePath and productName exports
 * POST /export-to-sheets
 * Body: { filePath?: string, productName?: string }
 * or
 * Body: { data: string, fieldType: 'filePath' | 'productName' }
 */
app.post('/export-to-sheets', async (req, res) => {
    try {
        const { filePath, productName, data, fieldType } = req.body;
        
        let success = false;
        let exportedValue = '';
        let exportType = '';

        // Handle new format: { data, fieldType }
        if (data && fieldType) {
            console.log(`\n📤 Export request received for ${fieldType}: ${data.substring(0, 50)}`);
            
            if (fieldType === 'productName') {
                success = await appendProductName(data);
                exportedValue = data;
                exportType = 'Product Name';
            } else {
                success = await appendBestCandidatePath(data);
                exportedValue = data;
                exportType = 'File Path';
            }
        }
        // Handle legacy format: { filePath }
        else if (filePath) {
            console.log(`\n📤 Export request received for: ${filePath}`);
            success = await appendBestCandidatePath(filePath);
            exportedValue = filePath;
            exportType = 'File Path';
        }
        // Handle legacy format: { productName }
        else if (productName) {
            console.log(`\n📤 Export request received for product: ${productName}`);
            success = await appendProductName(productName);
            exportedValue = productName;
            exportType = 'Product Name';
        }
        else {
            return res.status(400).json({
                success: false,
                message: 'No data provided. Submit either filePath or productName'
            });
        }
        
        if (success) {
            console.log(`✅ Successfully exported ${exportType} to Google Sheets\n`);
            return res.json({
                success: true,
                message: `${exportType} exported to Google Sheets`,
                exportType,
                data: exportedValue.substring(0, 50) + (exportedValue.length > 50 ? '...' : '')
            });
        } else {
            return res.status(500).json({
                success: false,
                message: `Failed to export ${exportType}. Check server logs.`
            });
        }
        
    } catch (error) {
        console.error('❌ Export error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Export Server running on http://localhost:${PORT}`);
    console.log(`\n📝 Supports exporting:`);
    console.log(`   • POST /export-to-sheets { filePath } → Column F`);
    console.log(`   • POST /export-to-sheets { productName } → Column G`);
    console.log(`   • POST /export-to-sheets { data, fieldType } → Flexible routing\n`);
    console.log('Press Ctrl+C to stop the server\n');
});
