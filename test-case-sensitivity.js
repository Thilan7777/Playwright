// Quick test to verify case-sensitive comparison works correctly

const stripSpecial = (str) => str.replace(/[^a-zA-Z0-9]/g, '');

const tests = [
  { search: "JRE.exe", actual: "jre.exe" },
  { search: "java.exe", actual: "Java.exe" },
  { search: "notepad.exe", actual: "NOTEPAD.EXE" }
];

console.log("Case-sensitive navigation comparison:");
tests.forEach(t => {
  const searchStripped = stripSpecial(t.search);
  const actualStripped = stripSpecial(t.actual);
  const result = searchStripped < actualStripped ? -1 : searchStripped > actualStripped ? 1 : 0;
  console.log(`  "${t.search}" vs "${t.actual}"`);
  console.log(`  Stripped: "${searchStripped}" vs "${actualStripped}"`);
  console.log(`  Result: ${result} ${result < 0 ? '(search < actual)' : result > 0 ? '(search > actual)' : '(equal)'}`);
  console.log();
});

console.log("\nCase-insensitive matching:");
tests.forEach(t => {
  const match = t.search.toLowerCase() === t.actual.toLowerCase();
  console.log(`  "${t.search}" matches "${t.actual}": ${match}`);
});

console.log("\nPrefix matching (lowercase):");
tests.forEach(t => {
  const searchPrefix = t.search.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 1);
  const actualPrefix = t.actual.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 1);
  const matches = searchPrefix === actualPrefix;
  console.log(`  "${t.search}" (prefix: "${searchPrefix}") vs "${t.actual}" (prefix: "${actualPrefix}"): ${matches}`);
});
