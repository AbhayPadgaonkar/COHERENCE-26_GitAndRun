"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send,  
  Bot, 
  MessageSquare, 
  X, 
  Maximize2, 
  Minimize2,
  Table as TableIcon,
  AlignLeft,
  Trash2
} from 'lucide-react';

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'table'>('text');
  
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      sender: 'bot', 
      text: "Namaste! I am the LokNidhi Citizen Assistant. You can ask me about government schemes or fund utilization. How can I help you today?" 
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from LocalStorage on mount
  useEffect(() => {
    const savedChat = localStorage.getItem('loknidhi_chat_history');
    if (savedChat) {
      try {
        setMessages(JSON.parse(savedChat));
      } catch (e) {
        console.error("Failed to parse chat history");
      }
    }
  }, []);

  // Save chat history to LocalStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('loknidhi_chat_history', JSON.stringify(messages));
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  const clearChat = () => {
    const initialMsg = [{ id: Date.now(), sender: 'bot', text: "Chat history cleared. How can I help you?" }];
    setMessages(initialMsg);
    localStorage.removeItem('loknidhi_chat_history');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const newUserMsg = { id: Date.now(), sender: 'user', text: userText };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

try {
      const formatInstruction = activeTab === 'table' 
        ? "\n\nCRITICAL INSTRUCTION: Format your entire response STRICTLY as an HTML table. Use standard tags (<table>, <thead>, <tr>, <th>, <tbody>, <td>) with inline styling or standard classes. Do NOT use markdown backticks." 
        : "\n\nCRITICAL INSTRUCTION: Format your response as normal readable text with HTML <br/> tags for line breaks or <ul>/<li> for lists. Do NOT use tables or markdown backticks.";

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText + formatInstruction }),
      });

      const data = await response.json();
      
      // NEW: Catch actual HTTP errors from the backend
      if (!response.ok) {
        throw new Error(data.error || `Server Error: ${response.status}`);
      }
      
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: data.reply 
      }]);
      
    } catch (error: any) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { 
        id: Date.now() + 1, 
        sender: 'bot', 
        text: `Error: ${error.message}. Please check your terminal console.` 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Floating Action Button (Shows when closed) */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-[#000080] hover:bg-blue-900 text-white p-4 rounded-full shadow-2xl transform transition-transform hover:scale-110 flex items-center justify-center border-2 border-white"
        >
          <MessageSquare className="w-7 h-7" />
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
            RTI AI
          </span>
        </button>
      )}

      {/* Chat Window (Shows when open) */}
      {isOpen && (
        <div 
          className={`bg-white rounded-2xl border border-gray-200 shadow-2xl flex flex-col transition-all duration-300 origin-bottom-right ${
            isExpanded ? 'w-[800px] h-[80vh] max-w-[calc(100vw-2rem)]' : 'w-[400px] h-[600px] max-w-[calc(100vw-2rem)]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#000080] to-[#05054d] p-4 rounded-t-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 shadow-sm">
                <Bot className="w-6 h-6 text-[#FF9933]" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">LokNidhi Assistant</h3>
                <p className="text-[10px] text-blue-200 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-green-400 mr-1 animate-pulse"></span> Public RTI Access
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 text-white/80">
              <button onClick={clearChat} title="Clear Chat" className="hover:text-white transition-colors p-1">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "Minimize" : "Maximize"} className="hover:text-white transition-colors p-1">
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button onClick={() => setIsOpen(false)} title="Close" className="hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Format Tabs */}
          <div className="flex bg-gray-50 border-b border-gray-200 p-1">
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'text' ? 'bg-white text-[#000080] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <AlignLeft className="w-4 h-4 mr-2" /> Text Explanation
            </button>
            <button 
              onClick={() => setActiveTab('table')}
              className={`flex-1 flex items-center justify-center py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'table' ? 'bg-white text-[#000080] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <TableIcon className="w-4 h-4 mr-2" /> Tabular Data
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex items-start ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 bg-[#000080] rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1 shadow-sm">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {/* Message Bubble - using dangerouslySetInnerHTML to render Gemini's HTML tables securely */}
                <div 
                  className={`p-3 text-sm shadow-sm overflow-x-auto ${
                    msg.sender === 'user' 
                      ? 'bg-[#000080] text-white rounded-2xl rounded-tr-none max-w-[85%]' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-tl-none w-full prose prose-sm max-w-none'
                  }`}
                  dangerouslySetInnerHTML={msg.sender === 'bot' ? { __html: msg.text } : undefined}
                >
                  {msg.sender === 'user' ? msg.text : undefined}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start">
                <div className="w-8 h-8 bg-[#000080] rounded-full flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-3 text-sm shadow-sm flex space-x-1 items-center h-10">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggested Prompts */}
          <div className="p-2 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
            <button onClick={() => setInputValue("Show me ministry allocations")} className="text-xs border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              Ministry Allocations
            </button>
            <button onClick={() => setInputValue("Which state has the lowest utilization?")} className="text-xs border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
              State Utilization
            </button>
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200 rounded-b-2xl">
            <div className="relative flex items-center">
              <input 
                type="text" 
                placeholder="Ask about schemes, budgets, or states..." 
                className="w-full text-sm border border-gray-300 rounded-full pl-4 pr-12 py-3 focus:outline-none focus:border-[#000080] focus:ring-1 focus:ring-[#000080]"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isTyping}
                className={`absolute right-2 p-2 rounded-full transition-colors ${
                  inputValue.trim() && !isTyping ? 'bg-[#FF9933] hover:bg-orange-500 text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>

        </div>
      )}
    </div>
  );
}

