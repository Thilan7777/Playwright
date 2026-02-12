/**
 * Unit tests for multi-process utilities
 * Run with: node tests/test-utilities.js
 */

const { parseProcessNames } = require('../utils/multi-process-runner');

console.log('🧪 Testing parseProcessNames() function\n');
console.log('='.repeat(60));

// Test cases
const testCases = [
  { input: 'chrome.exe', expected: ['chrome.exe'], description: 'Single process' },
  { input: 'chrome.exe, firefox.exe', expected: ['chrome.exe', 'firefox.exe'], description: 'Comma-separated' },
  { input: 'chrome.exe,firefox.exe,notepad.exe', expected: ['chrome.exe', 'firefox.exe', 'notepad.exe'], description: 'Comma-separated (no spaces)' },
  { input: 'chrome.exe\nfirefox.exe\nnotepad.exe', expected: ['chrome.exe', 'firefox.exe', 'notepad.exe'], description: 'Newline-separated' },
  { input: 'chrome.exe , firefox.exe , notepad.exe', expected: ['chrome.exe', 'firefox.exe', 'notepad.exe'], description: 'Comma with extra spaces' },
  { input: '  chrome.exe  ,  firefox.exe  ', expected: ['chrome.exe', 'firefox.exe'], description: 'With leading/trailing spaces' },
  { input: 'chrome.exe,\nfirefox.exe', expected: ['chrome.exe', 'firefox.exe'], description: 'Mixed separators' },
  { input: 'chrome.exe,,firefox.exe', expected: ['chrome.exe', 'firefox.exe'], description: 'Empty values (double comma)' },
  { input: 'chrome.exe\n\nfirefox.exe', expected: ['chrome.exe', 'firefox.exe'], description: 'Empty values (double newline)' },
  { input: '', expected: [], description: 'Empty string' },
  { input: '   ', expected: [], description: 'Only whitespace' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
  const result = parseProcessNames(test.input);
  const resultStr = JSON.stringify(result);
  const expectedStr = JSON.stringify(test.expected);
  const isPass = resultStr === expectedStr;
  
  if (isPass) {
    console.log(`✅ Test ${index + 1}: ${test.description}`);
    console.log(`   Input: "${test.input.replace(/\n/g, '\\n')}"`);
    console.log(`   Result: ${resultStr}`);
    passed++;
  } else {
    console.log(`❌ Test ${index + 1}: ${test.description}`);
    console.log(`   Input: "${test.input.replace(/\n/g, '\\n')}"`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Got: ${resultStr}`);
    failed++;
  }
  console.log('');
});

console.log('='.repeat(60));
console.log(`📊 Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

if (failed === 0) {
  console.log('✅ All tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed!');
  process.exit(1);
}
