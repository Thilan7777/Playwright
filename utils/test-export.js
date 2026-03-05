/**
 * Test export endpoint directly
 */

const http = require('http');

console.log('🧪 Testing Export Server Endpoint...\n');

// Test 1: Health check
console.log('1️⃣  Testing health endpoint...');
http.get('http://localhost:3000/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('✅ Health check passed:', json, '\n');
            testExport();
        } catch (e) {
            console.log('❌ Health check failed:', data, '\n');
        }
    });
}).on('error', (err) => {
    console.log('❌ Cannot connect to server on localhost:3000');
    console.log('   Make sure export-server.js is running\n');
    console.log('   Start with: node utils/export-server.js\n');
});

function testExport() {
    console.log('2️⃣  Testing export endpoint...');
    
    const testPath = 'C:\\Windows\\System32\\taskmgr.exe';
    const data = JSON.stringify({ filePath: testPath });
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/export-to-sheets',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };
    
    const req = http.request(options, (res) => {
        let response = '';
        res.on('data', chunk => response += chunk);
        res.on('end', () => {
            try {
                const json = JSON.parse(response);
                if (json.success) {
                    console.log('✅ Export test passed!');
                    console.log('   Response:', json);
                    console.log('\n🎉 Export server is working!\n');
                } else {
                    console.log('❌ Export failed:', json);
                }
            } catch (e) {
                console.log('❌ Invalid response:', response);
            }
        });
    });
    
    req.on('error', (err) => {
        console.log('❌ Request failed:', err.message);
    });
    
    req.write(data);
    req.end();
}
