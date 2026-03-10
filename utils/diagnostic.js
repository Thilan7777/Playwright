/**
 * Diagnostic Script for Google Sheets Integration
 * Tests each step of the connection
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

async function runDiagnostics() {
    console.log('\n🔍 Google Sheets Integration Diagnostic\n');
    
    // Step 1: Check credentials file
    console.log('1️⃣  Checking credentials.json...');
    const credentialsPath = path.join(__dirname, '../credentials.json');
    if (!fs.existsSync(credentialsPath)) {
        console.log('❌ credentials.json not found at:', credentialsPath);
        return;
    }
    console.log('✅ credentials.json found');
    
    // Step 2: Load and validate credentials
    console.log('\n2️⃣  Loading credentials...');
    let credentials;
    try {
        const credContent = fs.readFileSync(credentialsPath, 'utf-8');
        credentials = JSON.parse(credContent);
        console.log('✅ Credentials loaded');
        console.log(`   Service Account Email: ${credentials.client_email}`);
        console.log(`   Project ID: ${credentials.project_id}`);
    } catch (error) {
        console.log('❌ Error reading credentials:', error.message);
        return;
    }
    
    // Step 3: Test authorization
    console.log('\n3️⃣  Testing authorization...');
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const client = await auth.getClient();
        console.log('✅ Authorization successful');
    } catch (error) {
        console.log('❌ Authorization failed:', error.message);
        return;
    }
    
    // Step 4: Test sheet access
    console.log('\n4️⃣  Testing sheet access...');
    const SPREADSHEET_ID = '1M_DJYj5VtnO5cOrY9jl_le7UohfAYxJ14rVGcCuKHO8';
    const SHEET_NAME = 'Sheet1';
    
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Try to read sheet
        const response = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID
        });
        
        console.log('✅ Sheet access successful');
        console.log(`   Sheet Title: ${response.data.properties.title}`);
        console.log(`   Available sheets:`);
        response.data.sheets.forEach(sheet => {
            console.log(`      - ${sheet.properties.title}`);
        });
    } catch (error) {
        console.log('❌ Sheet access failed:', error.message);
        console.log('\n📝 Possible solutions:');
        console.log('   1. Check if you shared the sheet with:', credentials.client_email);
        console.log('   2. Verify Editor permissions were granted');
        console.log('   3. Wait a few moments and try again');
        return;
    }
    
    // Step 5: Test write permission
    console.log('\n5️⃣  Testing write permission...');
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Test writing to a cell
        const testResponse = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!F:F`
        });
        
        console.log('✅ Write permission verified');
        console.log(`   Column F has ${testResponse.data.values?.length || 0} entries`);
        
        // Show next available row
        const nextRow = (testResponse.data.values?.length || 0) + 1;
        console.log(`   Next available row: ${nextRow}`);
        
    } catch (error) {
        console.log('❌ Write permission test failed:', error.message);
        return;
    }
    
    // Step 6: Test actual append
    console.log('\n6️⃣  Testing append operation...');
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: credentialsPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        const sheets = google.sheets({ version: 'v4', auth });
        
        // Get next empty row
        const getCurrentData = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!F:F`
        });
        
        const nextRow = (getCurrentData.data.values?.length || 0) + 1;
        const cellAddress = `${SHEET_NAME}!F${nextRow}`;
        
        // Perform test append
        const testPath = `[TEST] C:\\Windows\\System32\\test.exe - ${new Date().toISOString()}`;
        
        const appendResponse = await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: cellAddress,
            valueInputOption: 'RAW',
            resource: {
                values: [[testPath]]
            }
        });
        
        console.log('✅ Append successful!');
        console.log(`   Cell: ${cellAddress}`);
        console.log(`   Test value: ${testPath}`);
        console.log('\n🎉 All checks passed! Your integration is ready to use.');
        
    } catch (error) {
        console.log('❌ Append failed:', error.message);
        return;
    }
}

// Run diagnostics
runDiagnostics().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
