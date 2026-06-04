const fs = require('fs');
const file = 'c:/Users/Joseph/Desktop/Fincontrol/FinControl-Web/src/pages/HistorialJornadas.jsx';

// Read file as raw binary
const buf = fs.readFileSync(file);

// Try to decode as UTF-8 and fix issues
let content = buf.toString('binary');

// The problematic lines: PowerShell wrote chars in Windows-1252
// Line 1448: · (middle dot, Windows-1252: 0xB7) -> UTF-8: \xC2\xB7
// Line 1532: í (i-acute, Windows-1252: 0xED) -> UTF-8: \xC3\xAD

// Since the file might be mixed, let's use a different approach:
// Read the file line by line and fix the specific lines

const lines = buf.toString('utf8', 0, buf.length).split('\n');

// Check each line for replacement characters (U+FFFD)
let fixedCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('\uFFFD') || (lines[i].charCodeAt && false)) {
    console.log(`Line ${i+1} has issues: ${JSON.stringify(lines[i].substring(0,80))}`);
    // Fix known patterns
    if (lines[i].includes('dv2-dot') && lines[i].includes('/span')) {
      lines[i] = lines[i].replace(/\uFFFD/g, '\u00B7');
      fixedCount++;
    }
    if (lines[i].includes('Cronolog') && lines[i].includes('de la Jornada')) {
      lines[i] = lines[i].replace(/Cronolog\uFFFD/g, 'Cronolog\u00ED');
      fixedCount++;
    }
  }
}

console.log('Fixed', fixedCount, 'lines');
const output = lines.join('\n');
fs.writeFileSync(file, output, 'utf8');
console.log('Saved. Verifying...');

// Verify
const verify = fs.readFileSync(file, 'utf8');
const vlines = verify.split('\n');
console.log('Line 1448:', vlines[1447].substring(0, 80));
console.log('Line 1532:', vlines[1531].substring(0, 80));
console.log('Total lines:', vlines.length);
