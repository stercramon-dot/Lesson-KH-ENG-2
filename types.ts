
export interface ScriptScene {
  sceneNumber: number;
  segmentType?: string;
  visualDescription: string;
  voiceoverText: string;
  khmerVoiceoverText?: string;
  pronunciationGuidance?: string;
  imagePrompt?: string;
  videoPrompt?: string;
}

export interface VideoScript {
  title: string;
  targetAudience: string;
  tone: string;
  scenes: ScriptScene[];
  searchReferences?: Array<{ web: { uri: string; title: string } }>;
}

export enum GenerationMode {
  FAST = 'fast',
  SEARCH = 'search',
  DEEP_THINKING = 'deep_thinking'
}

export type ScriptDuration = '15s' | '30s' | '60s';

export interface Message {
  role: 'user' | 'model';
  text: string;
  isAudio?: boolean;
}
