/**
 * strip-console.js — Remove unguarded console.log/debug/info from source files
 * 
 * Usage: node strip-console.js <websiteDir>
 * 
 * Preserves console statements guarded by isDev() or isDebugMode().
 * Outputs the count of stripped statements to stdout.
 */
const fs = require('fs');
const { execSync } = require('child_process');

const websiteDir = process.argv[2];
if (!websiteDir) { console.error('Usage: node strip-console.js <websiteDir>'); process.exit(1); }

// Find all source files
const files = execSync(
    'find "' + websiteDir + '" -type f \\( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \\) ' +
    '! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/out/*" ! -path "*/pitch-deck/*"',
    { encoding: 'utf-8' }
).trim().split('\n').filter(Boolean);

let totalStripped = 0;

for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const newLines = [];
    let stripped = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) { newLines.push(line); continue; }

        const hasConsole = /\bconsole\.(log|debug|info)\s*\(/.test(trimmed);
        if (!hasConsole) { newLines.push(line); continue; }

        // Check if guarded by isDev() or isDebugMode() in context (current + previous line)
        const context = (i > 0 ? lines[i - 1] : '') + ' ' + line;
        const isGuarded = /isDev\(\)|isDebugMode\(\)|process\.env\.NODE_ENV\s*===?\s*['"]development['"]/.test(context);

        if (isGuarded) {
            newLines.push(line);
        } else {
            stripped++;
            // If line is just a console statement, remove it entirely
            if (/^\s*console\.(log|debug|info)\s*\(/.test(line)) {
                // Handle multiline console calls
                let depth = 0;
                for (const ch of trimmed) { if (ch === '(') depth++; if (ch === ')') depth--; }
                while (depth > 0 && i + 1 < lines.length) {
                    i++;
                    for (const ch of lines[i].trim()) { if (ch === '(') depth++; if (ch === ')') depth--; }
                }
            } else {
                // Console is part of a larger expression — remove just the call
                const cleaned = line.replace(/console\.(log|debug|info)\s*\([^)]*\)\s*;?/, '');
                if (cleaned.trim()) newLines.push(cleaned);
            }
        }
    }

    if (stripped > 0) {
        fs.writeFileSync(filePath, newLines.join('\n'));
        totalStripped += stripped;
    }
}

console.log(totalStripped);
