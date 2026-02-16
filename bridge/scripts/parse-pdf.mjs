/**
 * PDF text extractor — ESM script
 * Usage: node scripts/parse-pdf.mjs <path-to-pdf>
 * Outputs JSON: { pages, text } to stdout
 */
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import fs from 'fs';
import path from 'path';

const filePath = process.argv[2];
if (!filePath) {
  process.stderr.write("Usage: node scripts/parse-pdf.mjs <path>\n");
  process.exit(1);
}

const absPath = path.resolve(filePath);
if (!fs.existsSync(absPath)) {
  process.stderr.write(`File not found: ${absPath}\n`);
  process.exit(1);
}

try {
  const buf = fs.readFileSync(absPath);
  const uint8 = new Uint8Array(buf);
  const doc = await getDocument({ data: uint8, verbosity: 0 }).promise;
  let text = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str || '').join(' ') + '\n';
  }
  process.stdout.write(JSON.stringify({ pages: doc.numPages, text: text.trim() }));
} catch (err) {
  process.stderr.write(`PDF parse error: ${err.message}\n`);
  process.exit(2);
}
