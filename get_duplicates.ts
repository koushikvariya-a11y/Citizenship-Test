import { QUESTIONS } from "./src/data/questions";

const seen = new Map<string, number[]>();
QUESTIONS.forEach(q => {
  const norm = q.questionDe.trim().toLowerCase();
  if (!seen.has(norm)) {
    seen.set(norm, []);
  }
  seen.get(norm)!.push(q.id);
});

console.log("Analyzing duplicates:");
let duplicateCount = 0;
for (const [text, ids] of seen.entries()) {
  if (ids.length > 1) {
    duplicateCount++;
    console.log(`- Text: "${text.substring(0, 60)}..."`);
    console.log(`  Found under IDs: ${ids.join(", ")}`);
  }
}
console.log(`Total duplicate texts: ${duplicateCount}`);
