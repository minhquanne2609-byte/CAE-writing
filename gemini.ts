import { GoogleGenAI, Type } from "@google/genai";
import { TaskType, GeneratedTask, ImprovedResponse, AssessmentFeedback, ScoreState } from './types';

// Constants for prompts
const C1_TOPICS = [
  "Urban Traffic and Transport Policies",
  "Funding for Local Facilities (Sports vs Arts)",
  "School Curriculum Changes",
  "Work-Life Balance and Remote Working",
  "Environmental Responsibility in Towns",
  "Youth Unemployment Solutions",
  "Preserving Local History vs Modernisation",
  "The Role of Museums and Libraries",
  "Healthy Eating Initiatives",
  "University Funding and Tuition",
  "Public Transport Improvements",
  "Supporting Local Businesses",
  "Technology in Classrooms",
  "Sports Facilities in Towns",
  "Charity and Community Service"
];

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a new Cambridge C1 Advanced Task (Essay or Report)
 */
export async function generateTask(taskType: TaskType): Promise<GeneratedTask | null> {
  const ai = getClient();
  const randomTopic = C1_TOPICS[Math.floor(Math.random() * C1_TOPICS.length)];

  let prompt = '';
  let schemaProperties: any = {
    context: { type: Type.STRING },
    question: { type: Type.STRING },
    points: { type: Type.ARRAY, items: { type: Type.STRING } },
    instructions: { type: Type.STRING }
  };
  let requiredFields = ["context", "question", "points", "instructions"];

  if (taskType === 'Essay') {
    prompt = `Generate a Cambridge C1 Advanced (CAE) Writing Part 1 Essay task about: "${randomTopic}".
    
    Structure:
    1. Context: Brief scene setting (e.g., "Your class has listened to a panel discussion...").
    2. Question: Practical policy/decision question (e.g., "Which facility should get funding?").
    3. Points: Exactly 3 noun phrases (e.g., "cycle paths").
    4. Opinions: Exactly 3 mixed opinions corresponding to points.
    5. Instructions: Standard C1 essay instruction.
    
    Keep it realistic (town planning, education, workplace). Avoid sci-fi.`;
    
    schemaProperties.opinions = { type: Type.ARRAY, items: { type: Type.STRING } };
    requiredFields.push("opinions");

  } else if (taskType === 'Report') {
    prompt = `Generate a Cambridge C1 Advanced (CAE) Writing Part 2 Report task about: "${randomTopic}".
    
    Structure:
    1. Context: Professional/academic situation defining role and reader.
    2. Question: Instruction on who to write to.
    3. Points: 2-3 specific content requirements.
    4. Instructions: "Write your report."
    
    Tone: Formal.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: schemaProperties,
        required: requiredFields
      }
    }
  });

  const jsonText = response.text;
  if (jsonText) {
    const baseTask = JSON.parse(jsonText);
    return {
      ...baseTask,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type: taskType
    };
  }
  return null;
}

/**
 * Improves student writing to C1 Band 5 Standard
 */
export async function improveWriting(text: string, taskContext: string): Promise<ImprovedResponse | null> {
  const ai = getClient();
  
  const prompt = `Act as a Cambridge English Editor. Rewrite this C1 Advanced student text to Band 5 standard.
  
  Rules: 
  1. RETAIN arguments/intent. 
  2. Upgrade vocab/grammar to C1/C2 level. 
  3. Enhance cohesion. 
  4. FIX all errors.
  
  Context: ${taskContext}
  Student Text: "${text}"
  
  Output JSON: { 
    "rewrittenText": "The full polished text...", 
    "keyChanges": [
       "List specific GRAMMAR/SPELLING ERRORS fixed (Format: 'Correction: [original] -> [fixed]')",
       "List specific VOCABULARY UPGRADES (Format: 'Upgrade: [original] -> [advanced]')",
       "List Structural Improvements"
    ] 
  }`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { 
      responseMimeType: 'application/json', 
      responseSchema: { 
        type: Type.OBJECT, 
        properties: { 
          rewrittenText: { type: Type.STRING }, 
          keyChanges: { type: Type.ARRAY, items: { type: Type.STRING } } 
        },
        required: ["rewrittenText", "keyChanges"]
      } 
    }
  });

  const jsonText = response.text;
  return jsonText ? JSON.parse(jsonText) : null;
}

/**
 * Assesses student writing based on Cambridge Subscales
 */
export async function assessWriting(text: string, taskContext: string): Promise<{ scores: ScoreState, feedback: AssessmentFeedback } | null> {
  const ai = getClient();
  
  const prompt = `Act as a senior Cambridge Examiner (CAE). Assess this text.
  Task: ${taskContext}
  Text: "${text}"
  Rubric: Content, Communicative Achievement, Organisation, Language.
  
  Output JSON: { 
    scores: {content, communicative, organisation, language}, 
    feedback: {
      content: {summary, strengths, weaknesses}, 
      communicative: {summary, strengths, weaknesses}, 
      organisation: {summary, strengths, weaknesses}, 
      language: {summary, strengths, weaknesses}, 
      general: string
    } 
  }`;

  const detailSchema = { 
    type: Type.OBJECT, 
    properties: { 
      summary: { type: Type.STRING }, 
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } }, 
      weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } } 
    }, 
    required: ["summary", "strengths", "weaknesses"] 
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          scores: { 
            type: Type.OBJECT, 
            properties: { 
              content: { type: Type.INTEGER }, 
              communicative: { type: Type.INTEGER }, 
              organisation: { type: Type.INTEGER }, 
              language: { type: Type.INTEGER } 
            },
            required: ["content", "communicative", "organisation", "language"]
          },
          feedback: { 
            type: Type.OBJECT, 
            properties: { 
              content: detailSchema, 
              communicative: detailSchema, 
              organisation: detailSchema, 
              language: detailSchema, 
              general: { type: Type.STRING } 
            },
            required: ["content", "communicative", "organisation", "language", "general"]
          }
        }
      }
    }
  });

  const jsonText = response.text;
  return jsonText ? JSON.parse(jsonText) : null;
}