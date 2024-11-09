import React, { useState, useRef, useEffect } from 'react';
import { Loader2, Send } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const ChatBotUI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availablePdfs, setAvailablePdfs] = useState<string[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch available PDFs when component mounts
  useEffect(() => {
    const fetchPdfs = async () => {
      try {
        const response = await fetch('http://localhost:5000/get-pdfs');
        const data = await response.json();
        if (data.pdfs) {
          setAvailablePdfs(data.pdfs);
          if (data.pdfs.length > 0) {
            setSelectedPdf(data.pdfs[0]); // Select first PDF by default
          }
        }
      } catch (err) {
        setError('Failed to fetch available PDFs');
      }
    };

    fetchPdfs();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !selectedPdf) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5000/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt,
          pdf_name: selectedPdf,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      setMessages(prev => [
        ...prev,
        { 
          role: 'user', 
          content: `[${selectedPdf}] ${prompt}`,
          timestamp: new Date()
        },
        { 
          role: 'assistant', 
          content: data.response,
          timestamp: new Date()
        },
      ]);
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[85%] ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-black shadow-sm border border-gray-700'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* PDF Selection Dropdown */}
          <div className="mb-4">
            <select
              value={selectedPdf}
              onChange={(e) => setSelectedPdf(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              {availablePdfs.map((pdf) => (
                <option key={pdf} value={pdf}>
                  {pdf}
                </option>
              ))}
            </select>
          </div>

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about the selected PDF..."
                className="w-full resize-none rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent p-3 pr-20 min-h-[52px] max-h-[200px] disabled:bg-gray-50"
                disabled={isLoading || availablePdfs.length === 0}
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !prompt.trim() || !selectedPdf}
              className="p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[52px]"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBotUI;