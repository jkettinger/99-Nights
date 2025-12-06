import { GoogleGenAI } from "@google/genai";
import { GrammarSubmission, WordToken, GrammarRole } from "../types";

// Initialize Gemini
// NOTE: We assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const gradePaperWithGemini = async (
  sentence: string,
  submission: GrammarSubmission,
  tokens: WordToken[]
): Promise<{ grade: string; feedback: string }> => {
  try {
    const selectedNoun = submission.nounId !== null ? tokens[submission.nounId].text : "Nothing";
    const selectedArticle = submission.articleId !== null ? tokens[submission.articleId].text : "Nothing";
    const selectedPrep = submission.prepositionId !== null ? tokens[submission.prepositionId].text : "Nothing";

    const prompt = `
      You are a strict, slightly creepy, old-school grammar teacher in a haunted school.
      A student has just submitted their grammar assignment for Day 1.
      
      The Sentence was: "${sentence}"
      
      The student was asked to find:
      1. A Noun. They selected: "${selectedNoun}"
      2. An Article. They selected: "${selectedArticle}"
      3. A Preposition. They selected: "${selectedPrep}"
      
      Grade them harshly but fairly based on standard English grammar.
      If they got everything right (Sun/Temperature/Driveway for noun, The for article, On for preposition), give them an A or B and a backhanded compliment.
      If they failed, give them an F and a subtle threat about staying after dark.
      
      Return ONLY a JSON object with this format:
      {
        "grade": "Letter Grade (A, B, C, F)",
        "feedback": "Your short verbal feedback to the student (max 2 sentences)."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Grading Failed:", error);
    // Fallback logic if AI fails or no key
    const isNounCorrect = submission.nounId !== null && tokens[submission.nounId].correctRoles.includes(GrammarRole.NOUN);
    const isArticleCorrect = submission.articleId !== null && tokens[submission.articleId].correctRoles.includes(GrammarRole.ARTICLE);
    const isPrepCorrect = submission.prepositionId !== null && tokens[submission.prepositionId].correctRoles.includes(GrammarRole.PREPOSITION);
    
    const allCorrect = isNounCorrect && isArticleCorrect && isPrepCorrect;

    return {
      grade: allCorrect ? "A" : "F",
      feedback: allCorrect 
        ? "Surprisingly adequate. Do not let it get to your head." 
        : "Pathetic. You might need to stay... late."
    };
  }
};

export const generateNightEvent = async (day: number): Promise<string> => {
  try {
    const prompt = `
      Generate a very short, creepy, atmospheric description for "Night ${day}" in a haunted school. 
      Max 20 words. Focus on sounds or shadows.
    `;
     const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "The lights flicker ominously...";
  } catch (e) {
    return "Something scratches at the window...";
  }
}