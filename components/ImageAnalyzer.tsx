
import React, { useState } from 'react';
import { getAiClient } from '../services/geminiService';

interface ImageAnalyzerProps {
  onContextExtracted: (base64: string, description: string) => void;
}

const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onContextExtracted }) => {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const base64 = (readerEvent.target?.result as string).split(',')[1];
        setImage(readerEvent.target?.result as string);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64: string) => {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: {
          parts: [
            { text: "Describe this image in detail and explain how it could be used as a storyboard or visual style reference for a video script. Be specific about lighting, colors, and mood." },
            { inlineData: { mimeType: 'image/jpeg', data: base64 } }
          ]
        }
      });
      const text = response.text || "No analysis generated.";
      setAnalysis(text);
      onContextExtracted(base64, text);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image context.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="glass p-8 rounded-3xl border border-white/5 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">Visual Context Analysis</h2>
          <p className="text-slate-400">Upload a storyboard frame, sketch, or mood board image to guide your script.</p>
        </div>

        {!image ? (
          <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700 rounded-3xl cursor-pointer hover:border-indigo-500 hover:bg-slate-900/30 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-slate-400 group-hover:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="mb-2 text-sm text-slate-300">
                <span className="font-semibold">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">PNG, JPG, WEBP (MAX. 800x400px)</p>
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
          </label>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative group">
              <img src={image} className="w-full rounded-2xl border border-slate-700 shadow-2xl" alt="Source" />
              <button 
                onClick={() => {setImage(null); setAnalysis(null);}} 
                className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl backdrop-blur-sm transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${analyzing ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'}`}></div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">AI Vision Commentary</h3>
              </div>
              {analyzing ? (
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-2/3 animate-pulse"></div>
                  <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-line bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-inner">
                    {analysis}
                  </p>
                  <div className="mt-4 p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 text-xs flex gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    This analysis will automatically guide the "Generator" when you click the Script tab.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageAnalyzer;
