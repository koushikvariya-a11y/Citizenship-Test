import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables for development
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini Client with graceful error boundaries
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
      throw new Error("GEMINI_API_KEY environment variable is not defined or is placeholder. Please configure your secrets in the AI Studio Settings panel.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. API: Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  });
});

// 2. API: Explain / Translate Difficult Terms using Gemini 3.5-Flash with JSON Schema
app.post("/api/dictionary/explain", async (req, res) => {
  const { word, contextSentence } = req.body;

  if (!word || typeof word !== "string" || word.trim() === "") {
    return res.status(400).json({ error: "Term is required" });
  }

  try {
    const ai = getAI();

    const prompt = `Analyze and explain the German term: "${word}".
    ${contextSentence ? `The word appears in this test question context: "${contextSentence}"` : ""}
    Provide an accurate English translation, its grammar category (e.g., Noun, Verb, Adjective), gender if it is a noun, a plain definition in German, a clear translation/definition in English, and specifically explain how this term applies to German legal frameworks, constitutional rights, state institutions, or history, particularly in the context of the German Citizenship Test ("Einbürgerungstest" / "Leben in Deutschland").`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a bilingually flawless German-English civic dictionary assistant. Your goal is to support foreign candidates preparing for the German Einbürgerungstest with highly educational grammatical and cultural insight.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            translation: { type: Type.STRING, description: "Primary English translation of the word" },
            partOfSpeech: { type: Type.STRING, description: "e.g., Noun, Verb, Adjective, Phrase" },
            gender: { type: Type.STRING, description: "der, die, das, or empty if not a noun" },
            germanDefinition: { type: Type.STRING, description: "Simple German explanation" },
            englishDefinition: { type: Type.STRING, description: "Simple English explanation" },
            pluralForm: { type: Type.STRING, description: "Plural form with article if noun (e.g. die Grundgesetze)" },
            testContextUsage: { type: Type.STRING, description: "Detailed civic translation/cultural context background for the citizenship test" }
          },
          required: ["word", "translation", "partOfSpeech", "germanDefinition", "englishDefinition", "testContextUsage"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
       throw new Error("No response output from Gemini model.");
    }

    const payload = JSON.parse(resultText);
    res.json(payload);
  } catch (error: any) {
    console.error("Gemini API Error:", error?.message || error);
    
    // Fallback: If no API key or failure, generate a friendly offline simulation
    // This allows active practice even if the user hasn't set their key yet!
    const mockedDefinitions: Record<string, any> = {
      "grundgesetz": {
        word: word,
        translation: "Basic Law",
        partOfSpeech: "Noun",
        gender: "das",
        germanDefinition: "Die Verfassung der Bundesrepublik Deutschland seit 1949.",
        englishDefinition: "The official constitution of the Federal Republic of Germany adopted in 1949.",
        pluralForm: "die Grundgesetze",
        testContextUsage: `[OFFLINE FALLBACK] "${word}" is the constitution. It lays down key human rights (Artikel 1-19) which cannot be abolished. For the test, remember Article 1 guarantees human dignity (Menschenwürde). (Please define GEMINI_API_KEY in Secrets for live lookups!)`
      },
      "rechtsstaat": {
        word: word,
        translation: "Constitutional state / Rule of law",
        partOfSpeech: "Noun",
        gender: "der",
        germanDefinition: "Ein Staat, in dem Regierung und Verwaltung nur im Rahmen der bestehenden Gesetze handeln dürfen.",
        englishDefinition: "A nation ruled by establish statutory laws where citizens' rights are legally protected against state abuse.",
        pluralForm: "die Rechtsstaaten",
        testContextUsage: `[OFFLINE FALLBACK] Germany is a "Rechtsstaat". It means all citizens, judges, politicians, and the police are strictly bound by the same laws. No one is above the law. (Please define GEMINI_API_KEY in Secrets for live lookups!)`
      }
    };

    const lowercaseWord = word.trim().toLowerCase();
    const fallbackObj = mockedDefinitions[lowercaseWord] || {
      word: word,
      translation: `Translation of "${word}"`,
      partOfSpeech: "Term",
      gender: "none",
      germanDefinition: `Bedeutung von "${word}" im Integrationskontext.`,
      englishDefinition: `Definition of "${word}" contextually.`,
      pluralForm: "n/a",
      testContextUsage: `[OFFLINE FALLBACK] Context for "${word}": This term appeared in active test practice questions. Set up your GEMINI_API_KEY secret in the settings panel to enable intelligent definitions, parts of speech, plural guides, and custom translation details for any term you click on!`
    };

    res.json(fallbackObj);
  }
});

// Serve Frontend Bundle
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
