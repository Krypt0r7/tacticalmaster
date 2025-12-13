import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { ItemType, LineType, TacticalItem, TacticalLine } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the tool for setting up the board
const tacticTool: FunctionDeclaration = {
  name: 'setupTacticalBoard',
  description: 'Setup the football board with items (players, cones, balls) and lines (movement, passes) to visualize a drill or tactic. Use this when the user asks to see, visualize, or create a drill.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      items: {
        type: Type.ARRAY,
        description: 'List of items to place on the pitch.',
        items: {
          type: Type.OBJECT,
          properties: {
            type: { 
              type: Type.STRING, 
              description: 'Item type.',
              enum: Object.values(ItemType)
            },
            x: { type: Type.NUMBER, description: 'X position 0-100 (0 is left, 100 is right)' },
            y: { type: Type.NUMBER, description: 'Y position 0-100 (0 is top, 100 is bottom)' },
            label: { type: Type.STRING, description: 'Optional label (e.g. "9", "LB")' },
          },
          required: ['type', 'x', 'y']
        }
      },
      lines: {
        type: Type.ARRAY,
        description: 'List of lines to draw (movement, passes, dribbles).',
        items: {
          type: Type.OBJECT,
          properties: {
            type: { 
              type: Type.STRING, 
              description: 'Line type.',
              enum: Object.values(LineType)
            },
            startX: { type: Type.NUMBER, description: 'Start X 0-100' },
            startY: { type: Type.NUMBER, description: 'Start Y 0-100' },
            endX: { type: Type.NUMBER, description: 'End X 0-100' },
            endY: { type: Type.NUMBER, description: 'End Y 0-100' },
          },
          required: ['type', 'startX', 'startY', 'endX', 'endY']
        }
      }
    }
  }
};

export const generateCoachingAdvice = async (
  query: string, 
  context?: string
): Promise<{ text: string; tacticData?: { items: TacticalItem[]; lines: TacticalLine[] } }> => {
  if (!process.env.API_KEY) {
    return { text: "Error: API Key is missing. Please configure the environment." };
  }

  try {
    const model = 'gemini-2.5-flash';
    
    const systemInstruction = `You are an elite-level Football Coach (UEFA Pro License holder) and tactical analyst. 
    Your goal is to assist coaches in designing training sessions and visualizing them.
    
    Guidelines:
    1. If the user asks for a specific drill or tactic that can be visualized, ALWAYS use the 'setupTacticalBoard' tool to create it.
    2. Be creative with player positions. 
       - Goalkeepers near goal (0-10% x or 90-100% x).
       - Midfielders in middle (40-60% x/y).
       - Use 'CONE' for boundaries or gates.
    3. Use standard football terminology.
    4. Keep text explanations concise if you are also providing a visualization.
    `;

    const finalPrompt = context 
      ? `Context: The user is working on a board named "${context}".\n\nQuestion: ${query}`
      : query;

    const response = await ai.models.generateContent({
      model,
      contents: finalPrompt,
      config: {
        systemInstruction,
        temperature: 0.7,
        tools: [{ functionDeclarations: [tacticTool] }]
      }
    });

    let tacticData = undefined;
    const text = response.text || "Here is the drill setup.";

    // Check for function calls in the candidates
    const functionCalls = response.functionCalls;
    
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'setupTacticalBoard') {
        const args = call.args as any;
        
        // Map API args to our app's internal types
        const items: TacticalItem[] = (args.items || []).map((item: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: item.type as ItemType,
          pos: { x: item.x, y: item.y },
          label: item.label,
          rotation: 0
        }));

        const lines: TacticalLine[] = (args.lines || []).map((line: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: line.type as LineType,
          start: { x: line.startX, y: line.startY },
          end: { x: line.endX, y: line.endY }
        }));

        tacticData = { items, lines };
      }
    }

    return { text, tacticData };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { text: "Sorry, I encountered an error connecting to the AI assistant." };
  }
};
