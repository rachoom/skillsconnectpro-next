import React, { useState, useEffect, useRef } from 'react';
import { getGeminiResponse } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const AIChatAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false); // 🔥 Restores toggle functionality
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hi! I'm the Skills Connect AI. How can I help you find an artisan today?" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInputText("");
    setIsLoading(true);

    try {
      const aiResponse = await getGeminiResponse(userMsg);
      setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "Oops! My connection failed. Please ensure you moved the .env file to the root folder and restarted the server." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 🔥 THE FLOATING CHAT BUBBLE (Restored) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 md:bottom-8 md:left-8 z-50 w-10 h-10 md:w-14 md:h-14 bg-brand-yellow rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform active:scale-95"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 md:w-7 md:h-7 text-black">
          <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97zM6.75 8.25a.75.75 0 01.75-.75h9a.75.75 0 010 1.5h-9a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H7.5z" clipRule="evenodd" />
        </svg>
      </button>

      {/* 🔥 THE CHAT WINDOW (Restored as Floating) */}
      {isOpen && (
        <div className="fixed bottom-24 left-6 z-50 flex flex-col h-[500px] w-[350px] bg-brand-black border border-brand-yellow/20 rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-fade-in-up">
          <div className="p-4 bg-brand-yellow text-black font-black uppercase tracking-widest text-[10px] flex justify-between items-center">
            <span>Skills Connect AI</span>
            <button onClick={() => setIsOpen(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium ${
                  msg.role === 'user' ? 'bg-brand-yellow text-black' : 'bg-gray-800 text-white'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && <div className="text-[10px] text-brand-yellow animate-pulse font-bold uppercase tracking-tighter">AI is typing...</div>}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-black/40 border-t border-white/5">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 bg-gray-900 border border-white/10 rounded-xl py-2 px-4 text-xs text-white outline-none focus:border-brand-yellow/50"
              />
              <button onClick={handleSend} className="text-brand-yellow hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};