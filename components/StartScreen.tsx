/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, MagicWandIcon, PaletteIcon, SunIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div 
      className={`w-full max-w-5xl mx-auto text-center p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-purple-500/10 border-dashed border-purple-400' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-100 sm:text-6xl md:text-7xl">
          AI 驱动的照片编辑，<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">从未如此简单</span>。
        </h1>
        <p className="max-w-2xl text-lg text-gray-400 md:text-xl">
          通过简单的文本指令，即可轻松修图、应用创意滤镜或进行专业调整。无需任何复杂工具。
        </p>

        <div className="mt-6 flex flex-col items-center gap-4">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-gradient-to-br from-purple-600 to-pink-500 rounded-full cursor-pointer group hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40">
                <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-500 ease-in-out group-hover:rotate-[360deg] group-hover:scale-110" />
                上传图片
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-sm text-gray-500">或将文件拖放到此处</p>
        </div>

        <div className="mt-16 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                       <MagicWandIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">精准修图</h3>
                    <p className="mt-2 text-gray-400">点击图像上的任意点，即可精确移除瑕疵、更改颜色或添加元素。</p>
                </div>
                <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                       <PaletteIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">创意滤镜</h3>
                    <p className="mt-2 text-gray-400">用艺术风格改造照片。从复古感到未来光效，创造属于你的完美滤镜。</p>
                </div>
                <div className="bg-black/20 p-6 rounded-lg border border-gray-700/50 flex flex-col items-center text-center">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-700 rounded-full mb-4">
                       <SunIcon className="w-6 h-6 text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">专业调整</h3>
                    <p className="mt-2 text-gray-400">增强光线、模糊背景或改变氛围。无需复杂工具即可获得影棚级效果。</p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default StartScreen;