import { QUESTIONS } from "./src/data/questions";

const deQuestions = QUESTIONS.map(q => q.questionDe.trim().toLowerCase());
const duplicates = deQuestions.filter((item, index) => deQuestions.indexOf(item) !== index);

console.log(`Total questions loaded: ${QUESTIONS.length}`);
console.log(`Unique questions: ${new Set(deQuestions).size}`);
console.log(`Duplicate count: ${duplicates.length}`);
if (duplicates.length > 0) {
  console.log("Some duplicates:", Array.from(new Set(duplicates)).slice(0, 10));
}
