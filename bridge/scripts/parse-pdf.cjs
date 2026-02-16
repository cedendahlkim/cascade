/**
 * PDF text extractor — CommonJS wrapper
 * Spawns an ESM subprocess to use pdfjs-dist (ESM-only).
 * Usage: node scripts/parse-pdf.cjs <path-to-pdf>
 * Outputs JSON: { pages, text } to stdout
 */
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const filePath = process.argv[2];
if (!filePath) {
  process.stderr.write("Usage: node parse-pdf.cjs <path>\n");
  process.exit(1);
}

const absPath = path.resolve(filePath).replace(/\\/g, "/");
if (!fs.existsSync(absPath)) {
  process.stderr.write(`File not found: ${absPath}\n`);
  process.exit(1);
}

// ESM script that uses pdfjs-dist
const esmScript = `
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
const buf = fs.readFileSync('${absPath}');
const uint8 = new Uint8Array(buf);
const doc = await getDocument({ data: uint8, verbosity: 0 }).promise;
let text = '';
for (let i = 1; i <= doc.numPages; i++) {
  const page = await doc.getPage(i);
  const content = await page.getTextContent();
  text += content.items.map(item => item.str || '').join(' ') + '\\n';
}
process.stdout.write(JSON.stringify({ pages: doc.numPages, text: text.trim() }));
`;

try {
  const result = execSync(`node --input-type=module -e "${esmScript.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`, {
    encoding: "utf-8",
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024,
    cwd: path.resolve(__dirname, ".."),
    stdio: ["pipe", "pipe", "pipe"],
  });
  process.stdout.write(result);
} catch (err) {
  process.stderr.write(`PDF parse error: ${err.stderr || err.message}\n`);
  process.exit(2);
}
