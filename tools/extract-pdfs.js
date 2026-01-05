const fs = require('fs');
const pdf = require('pdf-parse');

async function dump(path) {
  const data = fs.readFileSync(path);
  const res = await pdf(data);
  console.log(`\n==== ${path} ====`);
  console.log(`pages: ${res.numpages}`);
  console.log(res.text);
}

(async () => {
  const paths = [
    'c:/Users/Richard.Downing/Downloads/Invoice.pdf',
    'c:/Users/Richard.Downing/Downloads/Professional_Fees.pdf'
  ];

  for (const path of paths) {
    try {
      await dump(path);
    } catch (e) {
      console.error(`\n==== ${path} ====\nFAILED:`, e && e.message ? e.message : e);
    }
  }
})();
