
import React, { useState } from 'react';
import { GenerationMode, VideoScript, ScriptDuration } from '../types';
import { generateVideoScript, generateAudio, decodeAudioData, regenerateVisualDescription } from '../services/geminiService';
import VoiceoverPlayer from './VoiceoverPlayer';

interface ScriptGeneratorProps {
  initialImage?: string;
}

const TOPIC_PRESETS = [
  "Pronouncing the final -s clearly",
  "English for local markets in Cambodia",
  "Ordering at a coffee shop in Phnom Penh",
  "Polite workplace greetings in English",
  "How to use 'I have' vs 'I am'",
  "Essential English for Siem Reap Tourism"
];

const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ initialImage }) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.SEARCH);
  const [duration, setDuration] = useState<ScriptDuration>('30s');
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState<VideoScript | null>(null);
  const [audioStates, setAudioStates] = useState<Record<string, { loading: boolean, buffer?: AudioBuffer }>>({});
  const [regeneratingVisuals, setRegeneratingVisuals] = useState<Record<number, boolean>>({});

  const handleGenerate = async (overriddenPrompt?: string) => {
    const targetPrompt = overriddenPrompt || prompt;
    setLoading(true);
    setScript(null);
    setAudioStates({});
    try {
      const result = await generateVideoScript(targetPrompt, mode, duration, initialImage);
      setScript(result.script);
    } catch (error: any) {
      alert("Quota exceeded or error. Please wait 60 seconds.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAudio = async (sceneNumber: number, text: string, isKhmer: boolean) => {
    const key = `${sceneNumber}-${isKhmer ? 'kh' : 'en'}`;
    setAudioStates(prev => ({ ...prev, [key]: { loading: true } }));
    try {
      const audioBytes = await generateAudio(text, isKhmer);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = await decodeAudioData(audioBytes, ctx);
      setAudioStates(prev => ({ ...prev, [key]: { loading: false, buffer } }));
    } catch (error) {
      setAudioStates(prev => ({ ...prev, [key]: { loading: false } }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass p-8 rounded-3xl shadow-2xl border border-white/5 space-y-6">
        <div className="flex items-center justify-between">
          <div className="px-3 py-1 bg-emerald-600/20 rounded-full border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            Bilingual English-Khmer Mode
          </div>
          <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl">
            {(['15s', '30s', '60s'] as ScriptDuration[]).map((d) => (
              <button key={d} onClick={() => setDuration(d)} className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${duration === d ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>{d}</button>
            ))}
          </div>
        </div>
        
        <div className="space-y-4">
          <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Lesson Topic</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {TOPIC_PRESETS.map((t) => (
              <button key={t} onClick={() => setPrompt(t)} className="text-[10px] px-3 py-1.5 bg-slate-800 hover:bg-indigo-600/30 border border-slate-700 rounded-full text-slate-400 transition-all">{t}</button>
            ))}
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Stop saying 'I stay at' for 'I live in'..."
            className="w-full h-24 bg-slate-900/50 border border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none text-lg resize-none"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-800">
            {[{ id: GenerationMode.FAST, icon: '⚡' }, { id: GenerationMode.SEARCH, icon: '🌐' }, { id: GenerationMode.DEEP_THINKING, icon: '🧠' }].map((m) => (
              <button key={m.id} onClick={() => setMode(m.id as GenerationMode)} className={`px-4 py-2 rounded-xl text-sm transition-all ${mode === m.id ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{m.icon}</button>
            ))}
          </div>
          <button onClick={() => handleGenerate()} disabled={loading || !prompt} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-3">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Create Bilingual Lesson'}
          </button>
        </div>
      </div>

      {script && (
        <div className="space-y-6">
          <h2 className="text-3xl font-bold text-white px-2">{script.title}</h2>
          <div className="grid gap-6">
            {script.scenes.map((scene, index) => (
              <div key={index} className="glass p-6 rounded-3xl border border-white/5 hover:border-indigo-500/30 transition-all">
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Scene {index + 1} Visuals</span>
                    <p className="text-slate-300 text-sm italic">{scene.visualDescription}</p>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                      Visual Prompt: {scene.imagePrompt}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">Teacher Voiceover (English)</span>
                        <p className="text-white text-lg font-medium mb-3">{scene.voiceoverText}</p>
                        {!audioStates[`${index}-false`]?.buffer ? (
                          <button onClick={() => handleGenerateAudio(index, scene.voiceoverText, false)} disabled={audioStates[`${index}-false`]?.loading} className="text-xs text-indigo-400 font-bold flex items-center gap-2">
                            {audioStates[`${index}-false`]?.loading ? 'Loading...' : '▶ Generate English VO'}
                          </button>
                        ) : <VoiceoverPlayer buffer={audioStates[`${index}-false`].buffer!} />}
                      </div>

                      <div className="p-4 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">Khmer Translation (localized)</span>
                        <p className="text-white text-lg font-medium mb-3 font-khmer leading-relaxed">{scene.khmerVoiceoverText}</p>
                        {!audioStates[`${index}-true`]?.buffer ? (
                          <button onClick={() => handleGenerateAudio(index, scene.khmerVoiceoverText!, true)} disabled={audioStates[`${index}-true`]?.loading} className="text-xs text-emerald-400 font-bold flex items-center gap-2">
                            {audioStates[`${index}-true`]?.loading ? 'Loading...' : '▶ Generate Khmer VO'}
                          </button>
                        ) : <VoiceoverPlayer buffer={audioStates[`${index}-true`].buffer!} />}
                      </div>

                      {scene.pronunciationGuidance && (
                        <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block mb-2">Pronunciation Guidance</span>
                          <p className="text-slate-300 text-sm font-khmer leading-relaxed">
                            {scene.pronunciationGuidance}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptGenerator;
