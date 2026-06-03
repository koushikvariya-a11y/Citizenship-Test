export interface QuestionOption {
  textDe: string;
  textEn: string;
}

export interface Question {
  id: number;
  taskNumber: number; // e.g., 1, 2, 3 corresponding to PDF
  category: string; // e.g., 'Grundrechte', 'Geschichte', etc.
  questionDe: string;
  questionEn: string;
  options: QuestionOption[];
  correctIndex: number;
}

export interface DictionaryEntry {
  termDe: string;
  termEn: string;
  partOfSpeech?: string; // Noun, Verb, etc.
  gender?: 'der' | 'die' | 'das' | 'none'; // for German nouns
  definitionDe: string;
  definitionEn: string;
  contextExampleDe?: string;
  contextExampleEn?: string;
}

export interface QuizAttempt {
  id: string;
  timestamp: string;
  questionId: number;
  selectedIdx: number;
  isCorrect: boolean;
}

export interface TestSession {
  id: string;
  timestamp: string;
  type: 'practice' | 'mock-exam';
  totalQuestions: number;
  correctAnswers: number;
  questionsAttempted: {
    questionId: number;
    selectedIdx: number;
    isCorrect: boolean;
  }[];
}

export interface WordExplanationRequest {
  word: string;
  contextSentence?: string;
}

export interface WordExplanationResponse {
  word: string;
  translation: string;
  partOfSpeech: string;
  gender?: string;
  germanDefinition: string;
  englishDefinition: string;
  pronunciationHint?: string;
  pluralForm?: string;
  testContextUsage: string;
}
