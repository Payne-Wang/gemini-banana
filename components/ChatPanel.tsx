/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Spinner from './Spinner';

type ChatMessage = {
  role: 'user' | 'model';
  text: string;
};

interface ChatPanelProps {
  onSendMessage: (message: string) => void;
  chatHistory: ChatMessage[];
  isLoading: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ onSendMessage, chatHistory, isLoading }) => {
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  return (
    <div className="w-full h-[70vh] max-h-[700px] bg-gray-800/80 border border-gray-700/80 rounded-lg flex flex-col backdrop-blur-sm animate-fade-in">
      <div className="flex-grow p-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {/* FIX: The ReactMarkdown component does not accept a `className` prop. Moved typography classes to the parent container to style the rendered markdown content. */}
              <div
                className={`max-w-xl lg:max-w-2xl px-4 py-2 rounded-xl prose prose-invert prose-p:my-2 prose-headings:my-2 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-700 text-gray-200'
                }`}
              >
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isLoading && chatHistory[chatHistory.length - 1]?.role === 'user' && (
            <div className="flex justify-start">
              <div className="max-w-xl lg:max-w-2xl px-4 py-2 rounded-xl bg-gray-700 text-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="有什么可以帮您？"
            className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-3 text-base focus:ring-2 focus:ring-pink-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner disabled:from-purple-800 disabled:to-pink-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
            disabled={isLoading || !inputMessage.trim()}
          >
            发送
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPanel;