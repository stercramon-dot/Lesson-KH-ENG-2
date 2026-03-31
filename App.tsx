
import React, { useState } from 'react';
import Layout from './components/Layout';
import ScriptGenerator from './components/ScriptGenerator';
import ImageAnalyzer from './components/ImageAnalyzer';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('generator');
  const [imageContext, setImageContext] = useState<{ base64: string; description: string } | null>(null);

  const handleImageAnalysis = (base64: string, description: string) => {
    setImageContext({ base64, description });
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'generator':
        return <ScriptGenerator initialImage={imageContext?.base64} />;
      case 'analysis':
        return <ImageAnalyzer onContextExtracted={handleImageAnalysis} />;
      case 'projects':
        return (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-4 opacity-50">
            <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
               </svg>
            </div>
            <h2 className="text-xl font-bold">Project Library Coming Soon</h2>
            <p className="max-w-xs text-sm">Persistent storage for your scripts and audio assets is currently under development.</p>
          </div>
        );
      default:
        return <ScriptGenerator />;
    }
  };

  return (
    <div className="relative">
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
      <ChatBot />
      
      {/* Background Gradients */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-violet-500/10 blur-[120px] rounded-full"></div>
      </div>
    </div>
  );
};

export default App;
