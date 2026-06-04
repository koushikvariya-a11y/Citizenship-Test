import { GoogleGenAI, Type } from "@google/genai";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("Error: GEMINI_API_KEY is not set in env.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

interface QuestionOption {
  textDe: string;
  textEn: string;
}

interface Question {
  id: number;
  taskNumber: number;
  category: string;
  questionDe: string;
  questionEn: string;
  options: QuestionOption[];
  correctIndex: number;
}

const BATCH_SIZE = 25;
const TOTAL_QUESTIONS = 300;
const CACHE_DIR = "./src/data/temp_batches";

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const questionResponseSchema = {
  type: Type.ARRAY,
  description: "An array of official German Einbürgerungstest questions.",
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.INTEGER, description: "The sequential ID of the question in the official catalog." },
      taskNumber: { type: Type.INTEGER, description: "Matches the id, e.g. if ID is 46, taskNumber is 46." },
      category: { type: Type.STRING, description: "An official category like 'Leben in der Demokratie' (IDs 1-100), 'Geschichte und Verantwortung' (IDs 101-200), or 'Mensch und Gesellschaft' (IDs 201-300)." },
      questionDe: { type: Type.STRING, description: "The authentic, official German question text from the BAMF catalog." },
      questionEn: { type: Type.STRING, description: "A high-quality, completely accurate English translation of the German question." },
      options: {
        type: Type.ARRAY,
        description: "Exactly four official multiple-choice options.",
        items: {
          type: Type.OBJECT,
          properties: {
            textDe: { type: Type.STRING, description: "Official German option text." },
            textEn: { type: Type.STRING, description: "Accurate English translation of this option." }
          },
          required: ["textDe", "textEn"]
        }
      },
      correctIndex: { type: Type.INTEGER, description: "The 0-based index of the strictly correct official option (from 0 to 3)." }
    },
    required: ["id", "taskNumber", "category", "questionDe", "questionEn", "options", "correctIndex"]
  }
};

async function fetchBatch(start: number, end: number): Promise<Question[]> {
  const cachePath = path.join(CACHE_DIR, `batch_${start}_${end}.json`);

  // Check cache first
  if (fs.existsSync(cachePath)) {
    console.log(`Cache found for batch ${start} to ${end}. Skipping fetch.`);
    try {
      const data = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
      if (Array.isArray(data) && data.length > 0) {
        return data as Question[];
      }
    } catch (e: any) {
      console.warn(`Cache corrupted for batch ${start}_${end}: ${e.message}. Re-fetching.`);
    }
  }

  const prompt = `You are an expert German BAMF Einbürgerungstest (national citizenship test) data curator.
Please provide the official nationwide questions from ID ${start} to ID ${end} (inclusive).

Ensure:
1. Every question matches the official German catalog questions #${start} to #${end} in physical sequencing.
2. Provide precise English translations of all questions and options.
3. Every question must have exactly 4 options.
4. CorrectIndex is the accurate 0-based index (0, 1, 2, or 3) pointing to the official correct option.
5. All IDs and taskNumbers are correct sequential integers from ${start} to ${end}.

Return exactly ${end - start + 1} questions. No placeholders or dummy variables.`;

  console.log(`Sending batch ${start} to ${end} to Gemini...`);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      temperature: 0.1,
      systemInstruction: "You are a professional German BAMF Einbürgerungstest database assistant. Respond strictly in JSON format as defined.",
      responseMimeType: "application/json",
      responseSchema: questionResponseSchema
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error(`Empty response returned for batch ${start}-${end}`);
  }

  const parsed = JSON.parse(text) as Question[];
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`Invalid non-array format for batch ${start}-${end}`);
  }

  // Validate range and elements
  parsed.forEach(q => {
    if (q.id < start || q.id > end) {
      throw new Error(`Question ID ${q.id} generated out of request range ${start}-${end}`);
    }
    if (!q.options || q.options.length !== 4) {
      throw new Error(`Question ${q.id} does not have exactly 4 choices.`);
    }
    if (q.correctIndex < 0 || q.correctIndex > 3) {
      throw new Error(`Question ${q.id} has incorrectIndex ${q.correctIndex} out of valid bounds [0-3].`);
    }
  });

  // Write to cache
  fs.writeFileSync(cachePath, JSON.stringify(parsed, null, 2));
  console.log(`Successfully fetched and cached ${parsed.length} questions for range ${start}-${end}.`);
  return parsed;
}

async function run() {
  const allQuestions: Question[] = [];
  const batches: { start: number; end: number }[] = [];

  for (let start = 1; start <= TOTAL_QUESTIONS; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE - 1, TOTAL_QUESTIONS);
    batches.push({ start, end });
  }

  console.log(`Starting generation of all ${TOTAL_QUESTIONS} questions in ${batches.length} sequential cached batches with rate limiting throttling...`);

  let successCount = 0;
  for (let idx = 0; idx < batches.length; idx++) {
    const b = batches[idx];
    const isCached = fs.existsSync(path.join(CACHE_DIR, `batch_${b.start}_${b.end}.json`));

    let attempts = 0;
    let questions: Question[] = [];
    while (attempts < 3) {
      try {
        questions = await fetchBatch(b.start, b.end);
        allQuestions.push(...questions);
        successCount++;
        break;
      } catch (e: any) {
        attempts++;
        console.error(`Attempt ${attempts} failed for batch ${b.start}-${b.end}: ${e.message}`);
        if (attempts >= 3) {
          console.error("Critical error in batch generation. Halting progress. Run again to resume.");
          process.exit(1);
        }
        console.log("Waiting 45 seconds before retry...");
        await new Promise(r => setTimeout(r, 45000));
      }
    }

    // Only introduce throttling delay if we made an API request (not skipped from cache)
    // and if we are not at the final batch.
    if (!isCached && idx < batches.length - 1) {
      console.log("Throttling delay: waiting 15 seconds to avoid quota limits...");
      await new Promise(r => setTimeout(r, 15000));
    }
  }

  if (successCount === batches.length) {
    // Sort by ID
    allQuestions.sort((a, b) => a.id - b.id);
    console.log(`Finished fetching all: ${allQuestions.length} questions successfully!`);

    // Validation checks
    const duplicateIds: number[] = [];
    const missingIds: number[] = [];

    for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
      const count = allQuestions.filter(q => q.id === i).length;
      if (count > 1) {
        duplicateIds.push(i);
      } else if (count === 0) {
        missingIds.push(i);
      }
    }

    if (duplicateIds.length > 0 || missingIds.length > 0) {
      console.warn(`Warnings: Duplicate IDs = [${duplicateIds.join(",")}], Missing IDs = [${missingIds.join(",")}]`);
    }

    // Save final files
    fs.writeFileSync("./src/data/questions_raw_backup.json", JSON.stringify(allQuestions, null, 2));
    
    const tsContent = `// File automatically regenerated to ensure absolute sequencing and zero duplicates with correct De/En content
import { Question } from '../types';

export const QUESTIONS: Question[] = ${JSON.stringify(allQuestions, null, 2)};
`;

    fs.writeFileSync("./src/data/questions.ts", tsContent);
    console.log("Successfully compiled and saved all questions to src/data/questions.ts!");
  } else {
    console.log(`Partially compiled. Progress: ${successCount}/${batches.length} batches loaded. Re-run script to fetch remaining.`);
  }
}

run();
