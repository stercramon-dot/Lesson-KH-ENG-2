
import { GoogleGenAI, Type, Modality, GenerateContentResponse } from "@google/genai";
import { GenerationMode, VideoScript, ScriptDuration } from "../types";

const API_KEY = process.env.API_KEY || '';

export const getAiClient = () => {
  return new GoogleGenAI({ apiKey: API_KEY });
};

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1500): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = JSON.stringify(error).toLowerCase() || error?.message?.toLowerCase() || '';
    const isRateLimit = errorStr.includes('429') || errorStr.includes('resource_exhausted');
    const isServerError = errorStr.includes('500') || errorStr.includes('rpc failed') || errorStr.includes('unknown');
    
    if ((isRateLimit || isServerError) && retries > 0) {
      console.warn(`Gemini API Error: ${error.message || 'Network/Quota error'}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const regenerateVisualDescription = async (voiceoverText: string, tone: string): Promise<{ visualDescription: string; imagePrompt: string; videoPrompt: string }> => {
  return withRetry(async () => {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ 
        parts: [{ 
          text: `You are an ELT (English Language Teaching) Creative Director specialized in the Cambodian market. Given this English lesson snippet: "${voiceoverText}", generate:
1. A "visualDescription" including on-screen Khmer text overlays for pronunciation help.
2. A high-detail "imagePrompt" for a scene set in a modern Cambodian environment.
3. A "videoPrompt" for a 5-second teaching animation.

Tone of the lesson: "${tone}"` 
        }] 
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualDescription: { type: Type.STRING },
            imagePrompt: { type: Type.STRING },
            videoPrompt: { type: Type.STRING }
          },
          required: ["visualDescription", "imagePrompt", "videoPrompt"]
        }
      }
    });
    
    try {
      return JSON.parse(response.text || '{}');
    } catch (e) {
      return { visualDescription: response.text || "Error", imagePrompt: "", videoPrompt: "" };
    }
  });
};

export const generateVideoScript = async (
  prompt: string,
  mode: GenerationMode,
  duration: ScriptDuration = '30s',
  imageContext?: string // base64
): Promise<{ script: VideoScript; raw: string }> => {
  return withRetry(async () => {
    const ai = getAiClient();
    
    let modelName = 'gemini-3-flash-preview';
    const sceneCount = duration === '15s' ? 3 : (duration === '30s' ? 6 : 10);

    if (mode === GenerationMode.FAST) {
      modelName = 'gemini-flash-lite-latest';
    } else if (mode === GenerationMode.DEEP_THINKING) {
      modelName = 'gemini-3-pro-preview';
    }

    const config: any = {
      responseMimeType: "application/json",
      systemInstruction: `You are a specialized English Teacher for Khmer students. 
      You produce viral educational shorts that teach English while providing Khmer translations.

      KHMER TEACHING RULES:
      - Every scene MUST have a "khmerVoiceoverText" which is a natural, friendly translation or explanation in the Khmer language.
      - Address "Khmer-ish" mistakes (e.g. adding 's' to everything, or missing it entirely).
      - Use Khmer cultural context (Phnom Penh traffic, local foods like Num Banh Chok, Cambodian schools).

      SCHEMA:
      - title: A catchy title in English and Khmer.
      - scenes: Each scene needs sceneNumber, visualDescription (including Khmer text on screen), voiceoverText (English), khmerVoiceoverText (Khmer), and pronunciationGuidance (A short, clear guide for difficult Khmer words or phrases in the voiceover, using both Khmer script and simple phonetic hints).`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
          tone: { type: Type.STRING },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                sceneNumber: { type: Type.INTEGER },
                visualDescription: { type: Type.STRING },
                voiceoverText: { type: Type.STRING },
                khmerVoiceoverText: { type: Type.STRING },
                pronunciationGuidance: { type: Type.STRING },
                imagePrompt: { type: Type.STRING },
                videoPrompt: { type: Type.STRING }
              },
              required: ["sceneNumber", "visualDescription", "voiceoverText", "khmerVoiceoverText", "pronunciationGuidance", "imagePrompt", "videoPrompt"]
            }
          }
        },
        required: ["title", "scenes"]
      }
    };

    const parts: any[] = [{ text: `Create a professional ${duration} bilingual English-Khmer lesson about: ${prompt || 'daily conversation'}. Ensure the Khmer explanation is very natural and polite.` }];
    
    if (imageContext) {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: imageContext } });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config
    });

    let scriptData: VideoScript = JSON.parse(response.text || '{}');
    return { script: scriptData, raw: response.text || "" };
  });
};

export const generateAudio = async (text: string, isKhmer: boolean = false): Promise<Uint8Array> => {
  return withRetry(async () => {
    const ai = getAiClient();
    const prompt = isKhmer 
      ? `Read this Khmer text with a warm, encouraging, and clear Cambodian teacher voice: ${text}`
      : `Read this English sentence clearly and slowly for a student in Cambodia: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: isKhmer ? 'Kore' : 'Zephyr' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data received");
    
    return decode(base64Audio);
  });
};

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
