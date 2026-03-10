/**
 * Google Sheets Integration for Analytics Data
 * Extracts data and appends to Google Sheet with flexible column support
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration
const SPREADSHEET_ID = '1M_DJYj5VtnO5cOrY9jl_le7UohfAYxJ14rVGcCuKHO8';
const SHEET_NAME = 'Sheet1';
const COLUMNS = {
    filePath: 'F',      // File Path column
    productName: 'G'    // Product Name column
};
const HEADERS = {
    filePath: 'File Path',
    productName: 'Product Name'
};

/**
 * Generic function to append data to Google Sheet
 * @param {string} dataValue - The value to append
 * @param {string} fieldType - Type of field ('filePath' or 'productName')
 */
async function appendToSheet(dataValue, fieldType = 'filePath') {
    try {
        if (!dataValue || dataValue.trim() === '') {
            console.log(`No ${fieldType} to append`);
            return false;
        }

        // Check for credentials file
        const credentialsPath = path.join(__dirname, '../credentials.json');
        if (!fs.existsSync(credentialsPath)) {
            console.error('❌ credentials.json not found at', credentialsPath);
            return false;
        }

        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const targetColumn = COLUMNS[fieldType] || COLUMNS.filePath;

        // Find next empty row in target column
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!${targetColumn}:${targetColumn}`
        });

        const values = response.data.values || [];
        const nextRow = values.length + 1;
        const cellAddress = `${SHEET_NAME}!${targetColumn}${nextRow}`;

        // Append data
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: cellAddress,
            valueInputOption: 'RAW',
            resource: {
                values: [[dataValue]]
            }
        });

        console.log(`✅ ${fieldType} appended to ${cellAddress}`);
        console.log(`   Value: ${dataValue}`);
        return true;

    } catch (error) {
        console.error('❌ Error appending to Google Sheet:', error.message);
        return false;
    }
}

/**
 * Backward compatibility: Append best candidate path to Google Sheet
 */
async function appendBestCandidatePath(filePath) {
    return appendToSheet(filePath, 'filePath');
}

/**
 * Append product name to Google Sheet
 */
async function appendProductName(productName) {
    return appendToSheet(productName, 'productName');
}

module.exports = {
    appendToSheet,
    appendBestCandidatePath,
    appendProductName,
    SPREADSHEET_ID,
    SHEET_NAME,
    COLUMNS,
    HEADERS
};
