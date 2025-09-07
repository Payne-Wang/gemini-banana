/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface FreestylePanelProps {
  onApplyFreestyle: (prompt: string) => void;
  isLoading: boolean;
}

const FreestylePanel: React.FC<FreestylePanelProps> = ({ onApplyFreestyle, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleApply = () => {
    if (prompt.trim()) {
      onApplyFreestyle(prompt);
    }
  };

  const examplePrompts = [
    "给天空加上梦幻般的星云",
    "让人物穿上宇航服",
    "把这张照片变成梵高风格的油画",
    "在草地上加一只可爱的小猫",
  ];

  const handleExampleClick = (example: string) => {
    setPrompt(example);
  };

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-center text-gray-300">AI 自由创作</h3>
      <p className="text-sm text-gray-400 text-center -mt-2">描述您想对图片做的任何修改，AI 将尽力实现。</p>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="例如：'在草地上加一只可爱的小猫'"
        className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-pink-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[100px]"
        disabled={isLoading}
        rows={4}
      />

      <div className="flex flex-wrap gap-2 justify-center">
        {examplePrompts.map(p => (
          <button key={p} onClick={() => handleExampleClick(p)} disabled={isLoading} className="text-xs bg-white/10 px-3 py-1 rounded-full hover:bg-white/20 transition-colors">
            {p}
          </button>
        ))}
      </div>

      <button
        onClick={handleApply}
        className="w-full bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-purple-800 disabled:to-pink-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
        disabled={isLoading || !prompt.trim()}
      >
        应用
      </button>
    </div>
  );
};

export default FreestylePanel;