/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface BackgroundPanelProps {
  onApplyBackground: (prompt: string) => void;
  isLoading: boolean;
}

const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ onApplyBackground, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    if (prompt.trim()) {
      onApplyBackground(prompt);
    }
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">一键更换背景</h3>
      <p className="text-sm text-gray-400 text-center -mt-2">描述您想要的全新背景，AI 将无缝替换。</p>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="例如：'赛博朋克风格的东京街头' 或 '宁静的沙滩和日落'"
        className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-pink-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[80px]"
        disabled={isLoading}
        rows={3}
      />

      <button
        onClick={handleApply}
        className="w-full bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-purple-800 disabled:to-pink-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        disabled={isLoading || !prompt.trim()}
      >
        生成背景
      </button>
    </div>
  );
};

export default BackgroundPanel;