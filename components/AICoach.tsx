import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, X, LayoutTemplate } from 'lucide-react';
import { generateCoachingAdvice } from '../services/geminiService';
import { ChatMessage, TacticalItem, TacticalLine } from '../types';
import ReactMarkdown from 'react-markdown';

interface AICoachProps {
  onClose: () => void;
  currentTacticName?: string;
  onApplyTactic: (items: TacticalItem[], lines: TacticalLine[]) => void;
}

const AICoach: React.FC<AICoachProps> = ({ onClose, currentTacticName, onApplyTactic }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hello Coach! I can help you design drills. Ask me to "Create a 4v2 rondo" or "Show a corner kick setup".' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const result = await generateCoachingAdvice(userMsg.text, currentTacticName);
    
    setMessages(prev => [...prev, { 
      role: 'model', 
      text: result.text,
      tacticData: result.tacticData
    }]);
    setIsLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-200 animate-slide-in">
      {/* Header */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-brand text-white shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="text-pitch-light" />
          <div>
            <h2 className="font-semibold text-lg">AI Assistant Coach</h2>
            <p className="text-xs text-gray-400">Powered by Gemini 2.5</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-brand text-white rounded-br-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none prose prose-sm prose-green'
              }`}
            >
              {msg.role === 'model' ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
            
            {/* Tactic Visualization Action */}
            {msg.tacticData && (
              <button
                onClick={() => onApplyTactic(msg.tacticData!.items, msg.tacticData!.lines)}
                className="mt-2 flex items-center gap-2 bg-pitch-dark text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-pitch-grass shadow-md transition-all animate-bounce-short"
              >
                <LayoutTemplate size={14} />
                Visualize on Pitch
              </button>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-brand" size={16} />
              <span className="text-xs text-gray-500">Analysing football data...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 shrink-0">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="E.g. 'Show me a 2v1 attacking drill'"
            className="w-full bg-gray-100 border-0 rounded-xl px-4 py-3 pr-12 text-sm focus:ring-2 focus:ring-brand focus:bg-white transition-all resize-none h-14 max-h-32"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-2 bg-brand text-white rounded-lg hover:bg-brand-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoach;
