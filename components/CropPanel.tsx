/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';

interface CropPanelProps {
  onApplyCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  isCropping: boolean;
}

type AspectRatio = '自由' | '1:1' | '16:9';

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, onSetAspect, isLoading, isCropping }) => {
  const [activeAspect, setActiveAspect] = useState<AspectRatio>('自由');
  
  const handleAspectChange = (aspect: AspectRatio, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  }

  const aspects: { name: AspectRatio, value: number | undefined }[] = [
    { name: '自由', value: undefined },
    { name: '1:1', value: 1 / 1 },
    { name: '16:9', value: 16 / 9 },
  ];

  return (
    <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col items-center gap-4 animate-fade-in backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-300">裁剪图片</h3>
      <p className="text-sm text-gray-400 -mt-2">在图片上点击并拖动以选择裁剪区域。</p>
      
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-400">宽高比:</span>
        {aspects.map(({ name, value }) => (
          <button
            key={name}
            onClick={() => handleAspectChange(name, value)}
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-base font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
              activeAspect === name 
              ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-md shadow-pink-500/20' 
              : 'bg-white/10 hover:bg-white/20 text-gray-200'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <button
        onClick={onApplyCrop}
        disabled={isLoading || !isCropping}
        className="w-full max-w-xs mt-2 bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-purple-800 disabled:to-pink-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
      >
        应用裁剪
      </button>
    </div>
  );
};

export default CropPanel;