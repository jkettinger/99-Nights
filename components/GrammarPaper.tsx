
import React, { useState } from 'react';
import { WordToken, GrammarRole, GrammarSubmission } from '../types';

interface GrammarPaperProps {
  sentence: string;
  tokens: WordToken[];
  onSubmit: (submission: GrammarSubmission) => void;
  mode?: 'classic' | 'single_word';
}

export const GrammarPaper: React.FC<GrammarPaperProps> = ({ sentence, tokens, onSubmit, mode = 'classic' }) => {
  const [currentTool, setCurrentTool] = useState<GrammarRole | null>(mode === 'single_word' ? GrammarRole.TARGET_WORD : null);
  const [submission, setSubmission] = useState<GrammarSubmission>({
    nounId: null,
    articleId: null,
    prepositionId: null,
    singleWordId: null,
  });

  const handleWordClick = (wordId: number) => {
    if (!currentTool) return;

    setSubmission(prev => {
      const newItem = { ...prev };
      if (mode === 'single_word') {
          newItem.singleWordId = wordId;
      } else {
          if (currentTool === GrammarRole.NOUN) newItem.nounId = wordId;
          if (currentTool === GrammarRole.ARTICLE) newItem.articleId = wordId;
          if (currentTool === GrammarRole.PREPOSITION) newItem.prepositionId = wordId;
      }
      return newItem;
    });
  };

  const getHighlightClass = (wordId: number) => {
    if (mode === 'single_word') {
        if (submission.singleWordId === wordId) return "bg-red-800 text-white decoration-white underline decoration-4";
        return "hover:bg-red-100";
    }

    if (submission.nounId === wordId) return "bg-blue-200 decoration-blue-500 underline decoration-4";
    if (submission.articleId === wordId) return "bg-green-200 decoration-green-500 underline decoration-4";
    if (submission.prepositionId === wordId) return "bg-red-200 decoration-red-500 underline decoration-4";
    return "hover:bg-gray-100";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`
        w-full max-w-3xl min-h-[500px] shadow-2xl rotate-1 rounded-sm relative flex flex-col overflow-hidden text-gray-800 font-handwriting
        ${mode === 'single_word' ? 'bg-[#e0dada]' : 'bg-[#f0f0f0]'}
      `}>
        
        {/* Paper Lines */}
        <div className="absolute inset-0 pointer-events-none opacity-20" 
             style={{ backgroundImage: 'linear-gradient(#999 1px, transparent 1px)', backgroundSize: '100% 2rem', marginTop: '4rem' }}>
        </div>
        <div className="absolute left-12 top-0 bottom-0 w-0.5 bg-red-300 opacity-50 pointer-events-none"></div>

        {/* Header */}
        <div className="p-8 pb-4 border-b border-gray-300 relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-800">
                    {mode === 'single_word' ? "FINAL TEST" : "Grammar Test 1"}
                </h2>
                <p className="text-lg text-gray-600">Name: <span className="font-mono text-blue-700">Student 99</span></p>
            </div>
            <div className="text-right">
                <p className="text-red-600 font-bold text-xl border-2 border-red-600 p-2 rotate-12 inline-block">
                  GRADE: ___
                </p>
            </div>
          </div>
          <p className="italic text-gray-600">
              {mode === 'single_word' 
                ? "Instructions: Select the word that is NOT a suffix but changes the word sequence. Don't get it wrong." 
                : "Instructions: Identify the grammatical components of the sentence below. Do not fail."}
          </p>
        </div>

        {/* The Sentence Interaction Area */}
        <div className="flex-grow flex items-center justify-center p-8 relative z-10">
            <div className="text-3xl md:text-4xl leading-relaxed text-center font-serif tracking-wide">
                {tokens.map((token, index) => (
                    <span 
                        key={token.id}
                        onClick={() => handleWordClick(token.id)}
                        className={`
                            inline-block mx-1.5 px-1 rounded cursor-pointer transition-all duration-200
                            ${getHighlightClass(token.id)}
                            ${currentTool ? 'hover:scale-110' : ''}
                        `}
                    >
                        {token.text}
                    </span>
                ))}
            </div>
        </div>

        {/* Controls */}
        <div className="bg-gray-100 p-6 border-t border-gray-300 relative z-10">
            <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                
                {mode === 'classic' && (
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setCurrentTool(GrammarRole.NOUN)}
                            className={`px-4 py-2 rounded-full font-bold text-lg shadow-sm border-2 transition-all transform hover:-translate-y-1
                                ${currentTool === GrammarRole.NOUN ? 'bg-blue-500 text-white border-blue-600 scale-105' : 'bg-white text-blue-600 border-blue-200'}
                            `}
                        >
                            1. Find Noun {submission.nounId !== null && '✓'}
                        </button>
                        <button 
                            onClick={() => setCurrentTool(GrammarRole.ARTICLE)}
                            className={`px-4 py-2 rounded-full font-bold text-lg shadow-sm border-2 transition-all transform hover:-translate-y-1
                                ${currentTool === GrammarRole.ARTICLE ? 'bg-green-500 text-white border-green-600 scale-105' : 'bg-white text-green-600 border-green-200'}
                            `}
                        >
                            2. Find Article {submission.articleId !== null && '✓'}
                        </button>
                        <button 
                            onClick={() => setCurrentTool(GrammarRole.PREPOSITION)}
                            className={`px-4 py-2 rounded-full font-bold text-lg shadow-sm border-2 transition-all transform hover:-translate-y-1
                                ${currentTool === GrammarRole.PREPOSITION ? 'bg-red-500 text-white border-red-600 scale-105' : 'bg-white text-red-600 border-red-200'}
                            `}
                        >
                            3. Find Preposition {submission.prepositionId !== null && '✓'}
                        </button>
                    </div>
                )}
                
                {mode === 'single_word' && (
                    <div className="text-red-700 font-bold animate-pulse">
                        CHOOSE WISELY.
                    </div>
                )}

                <button 
                    onClick={() => onSubmit(submission)}
                    disabled={mode === 'classic' 
                        ? (submission.nounId === null || submission.articleId === null || submission.prepositionId === null)
                        : (submission.singleWordId === null)
                    }
                    className="bg-black text-white font-mono text-xl px-8 py-3 rounded hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg transition-all active:scale-95"
                >
                    SUBMIT PAPER
                </button>
            </div>
             <p className="text-center text-sm text-gray-500 mt-4">
                {mode === 'single_word' ? "Click the word." : "Select a category button, then click the corresponding word in the sentence."}
            </p>
        </div>

      </div>
    </div>
  );
};
