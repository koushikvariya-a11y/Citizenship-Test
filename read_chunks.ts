import * as fs from 'fs';
import * as path from 'path';

const chunkDir = './src/data/chunks';
const files = fs.readdirSync(chunkDir).filter(f => f.endsWith('.json'));

const seen = new Map<string, string[]>();

files.forEach(file => {
  const filePath = path.join(chunkDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const questions = Array.isArray(data) ? data : (data.questions ? data.questions : []);
  
  questions.forEach((q: any) => {
    const norm = q.questionDe.trim().toLowerCase();
    if (!seen.has(norm)) {
      seen.set(norm, []);
    }
    seen.get(norm)!.push(`${file} (ID: ${q.id})`);
  });
});

console.log("Analyzing duplicates across chunks:");
let dupCount = 0;
for (const [text, occurrences] of seen.entries()) {
  if (occurrences.length > 1) {
    dupCount++;
    console.log(`- Text: "${text.substring(0, 60)}..."`);
    console.log(`  Occurrences: ${occurrences.join(', ')}`);
  }
}
console.log(`Total duplicated texts in chunks: ${dupCount}`);

