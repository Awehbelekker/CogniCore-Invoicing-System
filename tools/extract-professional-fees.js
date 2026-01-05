const fs = require('fs');

async function extractWithPdfJs(filePath) {
  // pdfjs-dist v4 uses ESM; load via dynamic import.
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data, disableAutoFetch: true, disableStream: true });
  const doc = await loadingTask.promise;

  let allText = '';
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => ('str' in it ? it.str : '')).filter(Boolean);
    allText += strings.join(' ') + '\n';
  }
  return { pages: doc.numPages, text: allText };
}

(async () => {
  const path = 'c:/Users/Richard.Downing/Downloads/Professional_Fees.pdf';
  try {
    const res = await extractWithPdfJs(path);
    console.log(`==== ${path} ====`);
    console.log(`pages: ${res.pages}`);
    console.log(res.text);
  } catch (e) {
    console.error('FAILED:', e && e.message ? e.message : e);
    process.exitCode = 1;
  }
})();
