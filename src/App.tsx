/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Send, Loader2, Calculator, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Initialize Gemini AI
// Note: process.env.GEMINI_API_KEY is automatically injected by the platform.
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export default function App() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const outputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll the output textarea as text is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const solveProblem = async () => {
    if (!input.trim()) {
      setError('Please enter a math word problem first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setOutput('');

    try {
      const model = "gemini-3-flash-preview";
      const prompt = input;
      
      const result = await genAI.models.generateContentStream({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: "You are a math tutor. Solve the following word problem step-by-step. Be concise but clear. At the very end, provide the final answer clearly labeled as 'Final Answer:'.",
        },
      });

      // Handle streaming response for the "typing" effect
      for await (const chunk of result) {
        const chunkText = chunk.text;
        if (chunkText) {
          // We use a functional update to ensure we have the latest state
          setOutput((prev) => prev + chunkText);
        }
      }
    } catch (err: any) {
      console.error('AI Error:', err);
      setError('Sorry, there was an error processing your request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex items-center gap-3">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight">
              Word Math
            </h1>
            <p className="text-slate-400 text-sm">
              Solve Math Word Problems with AI
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Input Section */}
          <div className="space-y-2">
            <label htmlFor="problem-input" className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
              Enter your word problem
            </label>
            <div className="relative flex flex-col md:flex-row gap-3">
              <textarea
                id="problem-input"
                className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none text-slate-800 placeholder:text-slate-400"
                placeholder="Example: If a train travels 60 miles per hour for 3 hours, how far does it travel?"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isProcessing}
              />
              <button
                onClick={solveProblem}
                disabled={isProcessing}
                className={`md:w-32 h-auto flex flex-col items-center justify-center gap-2 rounded-xl font-bold transition-all ${
                  isProcessing 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 shadow-lg shadow-emerald-200'
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Send className="w-6 h-6" />
                )}
                <span className="text-xs uppercase">Submit</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Output Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="solution-output" className="block text-sm font-semibold text-slate-700 uppercase tracking-wider">
                AI Solution
              </label>
              <button 
                onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 text-xs font-medium uppercase"
              >
                <RefreshCw className="w-3 h-3" />
                Clear
              </button>
            </div>
            <textarea
              id="solution-output"
              ref={outputRef}
              readOnly
              className="w-full min-h-[250px] p-4 bg-slate-900 text-emerald-400 font-mono text-sm leading-relaxed border border-slate-800 rounded-xl outline-none resize-none shadow-inner"
              placeholder="The solution will appear here..."
              value={output}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
            Powered by Gemini AI • Step-by-Step Mathematical Reasoning
          </p>
        </div>
      </motion.div>
    </div>
  );
}
