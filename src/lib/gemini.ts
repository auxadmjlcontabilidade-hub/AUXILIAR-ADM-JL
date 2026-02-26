import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface Transaction {
  data: string;
  valor: number;
  historico: string;
}

export async function parseBankStatement(text: string): Promise<Transaction[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extraia as transações do seguinte texto de extrato bancário. 
    Retorne uma lista de objetos com: data (no formato DD/MM/AAAA), valor (número positivo para crédito, negativo para débito) e historico (descrição da transação).
    
    Texto do extrato:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            data: { type: Type.STRING, description: "Data da transação (DD/MM/AAAA)" },
            valor: { type: Type.NUMBER, description: "Valor da transação (negativo para saídas/débitos, positivo para entradas/créditos)" },
            historico: { type: Type.STRING, description: "Descrição ou histórico da transação" },
          },
          required: ["data", "valor", "historico"],
        },
      },
    },
  });

  try {
    const data = JSON.parse(response.text || "[]");
    return data;
  } catch (e) {
    console.error("Erro ao processar JSON do Gemini", e);
    return [];
  }
}
