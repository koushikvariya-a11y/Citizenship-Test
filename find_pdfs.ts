import * as fs from 'fs';
import * as path from 'path';

function findFiles(dir: string, ext: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
        results = results.concat(findFiles(file, ext));
      }
    } else {
      if (file.toLowerCase().endsWith(ext)) {
        results.push(file);
      }
    }
  });
  return results;
}

console.log("Searching for PDF files in the workspace...");
const pdfs = findFiles('.', '.pdf');
console.log(`Found PDFs: ${JSON.stringify(pdfs)}`);

console.log("Searching for JSON files in workspace (except node_modules/dist/etc):");
const jsons = findFiles('.', '.json');
console.log(`Found JSONs: ${JSON.stringify(jsons)}`);
