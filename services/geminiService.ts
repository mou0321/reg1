
import { GoogleGenAI, Type } from "@google/genai";
import { HousingEvent, FormField } from "../types";

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Default fields that every event usually needs
const DEFAULT_FIELDS: FormField[] = [
  { name: 'name', label: '姓名', type: 'text', required: true },
  { name: 'phone', label: '聯絡電話', type: 'tel', required: true },
  { name: 'email', label: '電子信箱', type: 'email', required: true }
];

export const parseEventsFromText = async (rawText: string): Promise<HousingEvent[]> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing");
    throw new Error("API Key is missing. Please set it in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Extract event information from the following text and format it into a structured JSON list. 
      The text may contain multiple events. 
      
      For 'imageUrl', if none is provided, suggest a keyword.
      For 'deadline', if not specified, default to 1 day before the event date.
      For 'maxParticipants', if not specified, default to 50.
      
      Identify if any specific extra information is needed from the user based on the description (e.g. "dietary restrictions" for food events, "age" for kids events) and add them to 'customFields'.
      
      Raw Text:
      ${rawText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              date: { type: Type.STRING, description: "YYYY-MM-DD format" },
              time: { type: Type.STRING, description: "e.g., 14:00-16:00" },
              location: { type: Type.STRING },
              description: { type: Type.STRING },
              imageKeyword: { type: Type.STRING },
              deadline: { type: Type.STRING, description: "YYYY-MM-DD" },
              maxParticipants: { type: Type.INTEGER },
              customFields: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "key for data (english)" },
                    label: { type: Type.STRING, description: "Label shown to user" },
                    type: { type: Type.STRING, enum: ["text", "number", "select"] },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options if type is select" }
                  }
                }
              }
            },
            required: ["title", "date", "location", "description"]
          }
        }
      }
    });

    const parsedData = JSON.parse(response.text || "[]");

    return parsedData.map((item: any) => {
      // Merge default fields with AI detected custom fields
      const formFields = [...DEFAULT_FIELDS];
      if (item.customFields && Array.isArray(item.customFields)) {
        item.customFields.forEach((f: any) => {
           // Ensure unique names
           if (!formFields.some(existing => existing.name === f.name)) {
             formFields.push({ ...f, required: false });
           }
        });
      }

      return {
        id: generateId(),
        title: item.title,
        date: item.date,
        time: item.time || "TBD",
        location: item.location,
        description: item.description,
        imageUrl: `https://picsum.photos/seed/${item.imageKeyword || 'event'}/600/400`,
        deadline: item.deadline || item.date,
        maxParticipants: item.maxParticipants || 50,
        formFields: formFields,
        isOpen: true
      };
    });

  } catch (error) {
    console.error("Error parsing events with Gemini:", error);
    throw error;
  }
};
