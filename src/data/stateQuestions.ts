import { Question } from '../types';

export interface BundeslandInfo {
  name: string;
  capital: string;
  wrongCapitals: string[];
  landtagPeriod: number; // usually 5 years
  votingAge: number; // 16 or 18
  flagDe: string;
  flagEn: string;
}

export const BUNDESLAENDER: Record<string, BundeslandInfo> = {
  "Baden-Württemberg": {
    name: "Baden-Württemberg",
    capital: "Stuttgart",
    wrongCapitals: ["Heidelberg", "Karlsruhe", "Mannheim"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "schwarz-gold",
    flagEn: "black-gold"
  },
  "Bayern": {
    name: "Bayern",
    capital: "München",
    wrongCapitals: ["Nürnberg", "Regensburg", "Ingolstadt"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "weiß-blau",
    flagEn: "white-blue"
  },
  "Berlin": {
    name: "Berlin",
    capital: "Berlin",
    wrongCapitals: ["Altona", "Pankow", "Schöneberg"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "weiß-rot",
    flagEn: "white-red"
  },
  "Brandenburg": {
    name: "Brandenburg",
    capital: "Potsdam",
    wrongCapitals: ["Cottbus", "Frankfurt/Oder", "Oranienburg"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "rot-weiß",
    flagEn: "red-white"
  },
  "Bremen": {
    name: "Bremen",
    capital: "Bremen",
    wrongCapitals: ["Bremerhaven", "Vegesack", "Hemelingen"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "rot-weiß",
    flagEn: "red-white"
  },
  "Hamburg": {
    name: "Hamburg",
    capital: "Hamburg",
    wrongCapitals: ["Harburg", "Altona", "Wandsbek"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "rot-weiß",
    flagEn: "red-white"
  },
  "Hessen": {
    name: "Hessen",
    capital: "Wiesbaden",
    wrongCapitals: ["Frankfurt", "Kassel", "Darmstadt"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "rot-weiß",
    flagEn: "red-white"
  },
  "Mecklenburg-Vorpommern": {
    name: "Mecklenburg-Vorpommern",
    capital: "Schwerin",
    wrongCapitals: ["Rostock", "Greifswald", "Wismar"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "blau-weiß-gelb-rot",
    flagEn: "blue-white-yellow-red"
  },
  "Niedersachsen": {
    name: "Niedersachsen",
    capital: "Hannover",
    wrongCapitals: ["Braunschweig", "Osnabrück", "Wolfsburg"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "schwarz-rot-gold",
    flagEn: "black-red-gold"
  },
  "Nordrhein-Westfalen": {
    name: "Nordrhein-Westfalen",
    capital: "Düsseldorf",
    wrongCapitals: ["Köln", "Bonn", "Dortmund"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "grün-weiß-rot",
    flagEn: "green-white-red"
  },
  "Rheinland-Pfalz": {
    name: "Rheinland-Pfalz",
    capital: "Mainz",
    wrongCapitals: ["Ludwigshafen", "Koblenz", "Kaiserslautern"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "schwarz-rot-gold",
    flagEn: "black-red-gold"
  },
  "Saarland": {
    name: "Saarland",
    capital: "Saarbrücken",
    wrongCapitals: ["Homburg", "Neunkirchen", "Saarlouis"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "schwarz-rot-gold",
    flagEn: "black-red-gold"
  },
  "Sachsen": {
    name: "Sachsen",
    capital: "Dresden",
    wrongCapitals: ["Leipzig", "Chemnitz", "Zwickau"],
    landtagPeriod: 5,
    votingAge: 18,
    flagDe: "weiß-grün",
    flagEn: "white-green"
  },
  "Sachsen-Anhalt": {
    name: "Sachsen-Anhalt",
    capital: "Magdeburg",
    wrongCapitals: ["Halle", "Dessau", "Wittenberg"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "gelb-schwarz",
    flagEn: "yellow-black"
  },
  "Schleswig-Holstein": {
    name: "Schleswig-Holstein",
    capital: "Kiel",
    wrongCapitals: ["Lübeck", "Flensburg", "Neumünster"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "blau-weiß-rot",
    flagEn: "blue-white-red"
  },
  "Thüringen": {
    name: "Thüringen",
    capital: "Erfurt",
    wrongCapitals: ["Jena", "Gera", "Weimar"],
    landtagPeriod: 5,
    votingAge: 16,
    flagDe: "rot-weiß",
    flagEn: "red-white"
  }
};

export function generateStateQuestions(stateName: string): Question[] {
  const info = BUNDESLAENDER[stateName];
  if (!info) return [];

  const baseId = 1000; // unique high base ID

  // Determine parliament name and head of government based on state type
  let parliamentNameDe = "Landtag";
  let parliamentNameEn = "State Parliament (Landtag)";
  let wrongParliamentNameDe = "Senat";
  let wrongParliamentNameEn = "Senate";

  let headOfGovDe = "Ministerpräsident / Ministerpräsidentin";
  let headOfGovEn = "Minister President";
  let wrongHeadOfGovDe = "Bundeskanzler / Bundeskanzlerin";
  let wrongHeadOfGovEn = "Federal Chancellor";

  if (stateName === "Berlin") {
    parliamentNameDe = "Abgeordnetenhaus";
    parliamentNameEn = "House of Representatives (Abgeordnetenhaus)";
    wrongParliamentNameDe = "Landtag";
    wrongParliamentNameEn = "Landtag";

    headOfGovDe = "Regierender Bürgermeister / Regierende Bürgermeisterin";
    headOfGovEn = "Governing Mayor";
    wrongHeadOfGovDe = "Ministerpräsident / Ministerpräsidentin";
    wrongHeadOfGovEn = "Minister President";
  } else if (stateName === "Hamburg") {
    parliamentNameDe = "Bürgerschaft";
    parliamentNameEn = "City Parliament (Bürgerschaft)";
    wrongParliamentNameDe = "Landtag";
    wrongParliamentNameEn = "Landtag";

    headOfGovDe = "Erster Bürgermeister / Erste Bürgermeisterin";
    headOfGovEn = "First Mayor";
    wrongHeadOfGovDe = "Ministerpräsident / Ministerpräsidentin";
    wrongHeadOfGovEn = "Minister President";
  } else if (stateName === "Bremen") {
    parliamentNameDe = "Bürgerschaft";
    parliamentNameEn = "City Parliament (Bürgerschaft)";
    wrongParliamentNameDe = "Landtag";
    wrongParliamentNameEn = "Landtag";

    headOfGovDe = "Präsident des Senats und Bürgermeister";
    headOfGovEn = "President of the Senate and Mayor";
    wrongHeadOfGovDe = "Ministerpräsident / Ministerpräsidentin";
    wrongHeadOfGovEn = "Minister President";
  }

  return [
    {
      id: baseId + 1,
      taskNumber: 301,
      category: `State Specific: ${stateName}`,
      questionDe: `Die Landeshauptstadt von ${stateName} heißt …`,
      questionEn: `The state capital of ${stateName} is called…`,
      correctIndex: 3,
      options: [
        { textDe: info.wrongCapitals[0], textEn: info.wrongCapitals[0] },
        { textDe: info.wrongCapitals[1], textEn: info.wrongCapitals[1] },
        { textDe: info.wrongCapitals[2], textEn: info.wrongCapitals[2] },
        { textDe: info.capital, textEn: info.capital }
      ]
    },
    {
      id: baseId + 2,
      taskNumber: 302,
      category: `State Specific: ${stateName}`,
      questionDe: `Welche Farben hat die Landesflagge von ${stateName}?`,
      questionEn: `Which colors are on the official state flag of ${stateName}?`,
      correctIndex: 0,
      options: [
        { textDe: info.flagDe, textEn: info.flagEn },
        { textDe: "blau-weiß-rot", textEn: "blue-white-red" },
        { textDe: "schwarz-gelb-rot", textEn: "black-yellow-red" },
        { textDe: "weiß-blau-gelb", textEn: "white-blue-yellow" }
      ]
    },
    {
      id: baseId + 3,
      taskNumber: 303,
      category: `State Specific: ${stateName}`,
      questionDe: `Ab welchem Alter darf man in ${stateName} bei Kommunalwahlen wählen?`,
      questionEn: `From what age are citizens allowed to vote in municipal elections in ${stateName}?`,
      correctIndex: info.votingAge === 16 ? 0 : 1,
      options: [
        { textDe: "16", textEn: "16 years old" },
        { textDe: "18", textEn: "18 years old" },
        { textDe: "20", textEn: "20 years old" },
        { textDe: "21", textEn: "21 years old" }
      ]
    },
    {
      id: baseId + 4,
      taskNumber: 304,
      category: `State Specific: ${stateName}`,
      questionDe: `Wie oft wird das Landesparlament (${parliamentNameDe}) in ${stateName} gewählt?`,
      questionEn: `How often is the state parliament (${parliamentNameEn}) in ${stateName} elected?`,
      correctIndex: 2,
      options: [
        { textDe: "alle 3 Jahre", textEn: "every 3 years" },
        { textDe: "alle 4 Jahre", textEn: "every 4 years" },
        { textDe: `alle ${info.landtagPeriod} Jahre`, textEn: `every ${info.landtagPeriod} years` },
        { textDe: "alle 6 Jahre", textEn: "every 6 years" }
      ]
    },
    {
      id: baseId + 5,
      taskNumber: 305,
      category: `State Specific: ${stateName}`,
      questionDe: `Wie heißt die Regierungschefin / der Regierungschef in ${stateName}?`,
      questionEn: `What is the title of the head of government in ${stateName}?`,
      correctIndex: 0,
      options: [
        { textDe: headOfGovDe, textEn: headOfGovEn },
        { textDe: wrongHeadOfGovDe, textEn: wrongHeadOfGovEn },
        { textDe: "Bundesminister / Bundesministerin", textEn: "Federal Minister" },
        { textDe: "Regierungspräsident / Regierungspräsidentin", textEn: "District President" }
      ]
    },
    {
      id: baseId + 6,
      taskNumber: 306,
      category: `State Specific: ${stateName}`,
      questionDe: `Wie heißt das Landesparlament (Volksvertretung) in ${stateName}?`,
      questionEn: `What is the official name of the state parliament in ${stateName}?`,
      correctIndex: 1,
      options: [
        { textDe: wrongParliamentNameDe, textEn: wrongParliamentNameEn },
        { textDe: parliamentNameDe, textEn: parliamentNameEn },
        { textDe: "Bundestag", textEn: "German Bundestag" },
        { textDe: "Bundesrat", textEn: "Federal Council (Bundesrat)" }
      ]
    },
    {
      id: baseId + 7,
      taskNumber: 307,
      category: `State Specific: ${stateName}`,
      questionDe: `Welches Ministerium bzw. welchen Minister hat ${stateName} als Bundesland NICHT?`,
      questionEn: `Which state ministry or minister does ${stateName} NOT have?`,
      correctIndex: 0,
      options: [
        { textDe: "Außenminister / Außenministerin", textEn: "Foreign Minister (Außenminister/in)" },
        { textDe: "Finanzminister / Finanzministerin", textEn: "Finance Minister (Finanzminister/in)" },
        { textDe: "Innenminister / Innenministerin", textEn: "Interior Minister (Innenminister/in)" },
        { textDe: "Justizminister / Justizministerin", textEn: "Justice Minister (Justizminister/in)" }
      ]
    },
    {
      id: baseId + 8,
      taskNumber: 308,
      category: `State Specific: ${stateName}`,
      questionDe: `Für welchen Politikbereich ist ${stateName} hauptsächlich selbst verantwortlich (Kulturhoheit)?`,
      questionEn: `For which political area is ${stateName} primarily responsible under federalism (legislative cultural sovereignty)?`,
      correctIndex: 2,
      options: [
        { textDe: "Verteidigung und Bundeswehr", textEn: "Defense and the military" },
        { textDe: "Währung, Geldpolitik und Zoll", textEn: "Currency, monetary policy, and customs" },
        { textDe: "Schulpflicht, Kultur und Bildungswesen", textEn: "Compulsory schooling, culture, and education" },
        { textDe: "Auswärtige Beziehungen und Diplomatie", textEn: "Foreign relations and diplomacy" }
      ]
    },
    {
      id: baseId + 9,
      taskNumber: 309,
      category: `State Specific: ${stateName}`,
      questionDe: `Welche Einrichtung klärt in ${stateName} Bürgerinnen und Bürger über Politik und Demokratie auf?`,
      questionEn: `Which institution in ${stateName} educates and informs citizens about politics and democracy?`,
      correctIndex: 3,
      options: [
        { textDe: "Das Einwohnermeldeamt", textEn: "The residents' registration office" },
        { textDe: "Das örtliche Jugendamt", textEn: "The local youth welfare office" },
        { textDe: "Die Agentur für Arbeit", textEn: "The federal employment agency" },
        { textDe: "Die Landeszentrale für politische Bildung", textEn: "The State Agency for Civic Education" }
      ]
    },
    {
      id: baseId + 10,
      taskNumber: 310,
      category: `State Specific: ${stateName}`,
      questionDe: `Wer darf in ${stateName} an den regulären Landtagswahlen teilnehmen?`,
      questionEn: `Who is allowed to vote in the regular state elections in ${stateName}?`,
      correctIndex: 1,
      options: [
        { textDe: "Alle ausländischen Mitbürger mit deutscher Aufenthaltserlaubnis", textEn: "All foreign co-citizens with a German residence permit" },
        { textDe: `Deutsche Staatsbürger, die das Mindestwahlalter erreicht haben und in ${stateName} wohnen`, textEn: `German citizens who have reached the minimum voting age and reside in ${stateName}` },
        { textDe: "Nutznießer von Zweitwohnsitzen ohne deutschen Pass", textEn: "Second-home owners without a German passport" },
        { textDe: "Alle Angestellten im öffentlichen Dienst des Bundeslandes", textEn: "All public sector employees of the federal state" }
      ]
    }
  ];
}
