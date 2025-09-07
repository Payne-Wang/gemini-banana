/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import { generateEditedImage, generateFilteredImage, generateAdjustedImage, generateChatResponse, generateBackgroundImage, generateFreestyleImage } from './services/geminiService';
import Header from './components/Header';
import Spinner from './components/Spinner';
import FilterPanel from './components/FilterPanel';
import AdjustmentPanel from './components/AdjustmentPanel';
import CropPanel from './components/CropPanel';
import ChatPanel from './components/ChatPanel';
import BackgroundPanel from './components/BackgroundPanel';
import FreestylePanel from './components/ToolOptions';
import ImagePreviewModal from './components/ImagePreviewModal';
import { UndoIcon, RedoIcon, EyeIcon, MagicWandIcon, LandscapeIcon, SunIcon, PaletteIcon, CropIcon, ChatIcon, BullseyeIcon, DownloadIcon, ExternalLinkIcon, SparklesIcon } from './components/icons';
import StartScreen from './components/StartScreen';

// Helper to convert a data URL string to a File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) throw new Error("Invalid data URL");
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch || !mimeMatch[1]) throw new Error("Could not parse MIME type from data URL");

    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, {type:mime});
}

// Helper function to get cropped image data URL
const getCroppedImg = (image: HTMLImageElement, crop: PixelCrop): string => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = crop.width * pixelRatio;
    canvas.height = crop.height * pixelRatio;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    return canvas.toDataURL('image/png');
}


type Tab = 'retouch' | 'freestyle' | 'background' | 'adjust' | 'filters' | 'crop' | 'chat';
type ChatMessage = { role: 'user' | 'model'; text: string; };

const App: React.FC = () => {
  const [history, setHistory] = useState<File[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [editHotspot, setEditHotspot] = useState<{ x: number, y: number } | null>(null);
  const [displayHotspot, setDisplayHotspot] = useState<{ x: number, y: number } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('retouch');
  
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);

  const currentImage = history[historyIndex] ?? null;
  const originalImage = history[0] ?? null;

  const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);

  // Effect to create and revoke object URLs safely for the current image
  useEffect(() => {
    if (currentImage) {
      const url = URL.createObjectURL(currentImage);
      setCurrentImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCurrentImageUrl(null);
    }
  }, [currentImage]);
  
  // Effect to create and revoke object URLs safely for the original image
  useEffect(() => {
    if (originalImage) {
      const url = URL.createObjectURL(originalImage);
      setOriginalImageUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setOriginalImageUrl(null);
    }
  }, [originalImage]);


  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const addImageToHistory = useCallback((newImageFile: File) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImageFile);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Reset transient states after an action
    setCrop(undefined);
    setCompletedCrop(undefined);
  }, [history, historyIndex]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setHistory([file]);
    setHistoryIndex(0);
    setEditHotspot(null);
    setDisplayHotspot(null);
    setActiveTab('retouch');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setChatHistory([]);
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!currentImage) {
      setError('没有加载可编辑的图片。');
      return;
    }
    
    if (!prompt.trim()) {
        setError('请输入您想如何编辑的描述。');
        return;
    }

    if (!editHotspot) {
        setError('请在图片上点击以选择一个编辑区域。');
        return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
        const editedImageUrl = await generateEditedImage(currentImage, prompt, editHotspot);
        const newImageFile = dataURLtoFile(editedImageUrl, `edited-${Date.now()}.png`);
        addImageToHistory(newImageFile);
        setEditHotspot(null);
        setDisplayHotspot(null);
        setPrompt('');
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        setError(`生成图片失败。 ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, prompt, editHotspot, addImageToHistory]);
  
  const handleApplyFilter = useCallback(async (filterPrompt: string) => {
    if (!currentImage) {
      setError('没有加载可应用滤镜的图片。');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const filteredImageUrl = await generateFilteredImage(currentImage, filterPrompt);
        const newImageFile = dataURLtoFile(filteredImageUrl, `filtered-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        setError(`应用滤镜失败。 ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);
  
  const handleApplyAdjustment = useCallback(async (adjustmentPrompt: string) => {
    if (!currentImage) {
      setError('没有加载可应用调整的图片。');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const adjustedImageUrl = await generateAdjustedImage(currentImage, adjustmentPrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `adjusted-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        setError(`应用调整失败。 ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyBackground = useCallback(async (backgroundPrompt: string) => {
    if (!currentImage) {
      setError('没有加载可更换背景的图片。');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const newImageUrl = await generateBackgroundImage(currentImage, backgroundPrompt);
        const newImageFile = dataURLtoFile(newImageUrl, `background-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        setError(`更换背景失败。 ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleApplyFreestyle = useCallback(async (freestylePrompt: string) => {
    if (!currentImage) {
      setError('没有加载可应用调整的图片。');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
        const adjustedImageUrl = await generateFreestyleImage(currentImage, freestylePrompt);
        const newImageFile = dataURLtoFile(adjustedImageUrl, `freestyle-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        setError(`自由创作失败。 ${errorMessage}`);
        console.error(err);
    } finally {
        setIsLoading(false);
    }
  }, [currentImage, addImageToHistory]);

  const handleSendMessage = useCallback(async (message: string) => {
    setIsChatLoading(true);
    setError(null);
    const updatedChatHistory = [...chatHistory, { role: 'user' as const, text: message }];
    setChatHistory(updatedChatHistory);

    try {
      const responseText = await generateChatResponse(message);
      setChatHistory([...updatedChatHistory, { role: 'model' as const, text: responseText }]);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        setError(`聊天时发生错误。 ${errorMessage}`);
        setChatHistory(updatedChatHistory); // Keep user message even if AI fails
        console.error(err);
    } finally {
      setIsChatLoading(false);
    }
  }, [chatHistory]);

  const handleUndo = useCallback(() => {
    if (canUndo) setHistoryIndex(historyIndex - 1);
  }, [canUndo, historyIndex]);

  const handleRedo = useCallback(() => {
    if (canRedo) setHistoryIndex(historyIndex - 1);
  }, [canRedo, historyIndex]);

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (activeTab === 'retouch') {
        const img = e.currentTarget;
        const rect = img.getBoundingClientRect();
        // Calculate scale factor
        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;
        
        // Calculate click coordinates relative to the image element
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        
        // Scale coordinates to natural image dimensions
        const naturalX = Math.round(clientX * scaleX);
        const naturalY = Math.round(clientY * scaleY);
    
        setEditHotspot({ x: naturalX, y: naturalY });
        setDisplayHotspot({ x: clientX, y: clientY });
        setError(null);
    } else if (activeTab !== 'crop') { // Do not open preview when in crop mode
        setIsPreviewOpen(true);
    }
  };

  const handleCrop = useCallback(async () => {
    if (!completedCrop || !imgRef.current) {
        setError("请先选择一个裁剪区域。");
        return;
    }
    
    try {
        const croppedImageUrl = getCroppedImg(imgRef.current, completedCrop);
        const newImageFile = dataURLtoFile(croppedImageUrl, `cropped-${Date.now()}.png`);
        addImageToHistory(newImageFile);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '发生未知错误。';
        setError(`裁剪图片失败。 ${errorMessage}`);
        console.error(err);
    }
  }, [completedCrop, addImageToHistory]);

  const handleDownload = useCallback(() => {
    if (currentImageUrl) {
      const link = document.createElement('a');
      link.href = currentImageUrl;
      link.download = `光影铺-编辑-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [currentImageUrl]);

  const handleViewInNewTab = useCallback(() => {
    if (currentImageUrl) {
        window.open(currentImageUrl, '_blank');
    }
  }, [currentImageUrl]);


  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      handleImageUpload(files[0]);
    }
  };
  
  const mainContent = currentImage ? (
    <div className="flex-grow w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 p-4 md:p-8">
        {/* Left Side: Image Viewer */}
        <div className="flex-grow lg:w-2/3 flex flex-col items-center justify-center relative bg-black/20 rounded-lg overflow-hidden border border-gray-700/50">
            {isLoading && (
                <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center z-30 backdrop-blur-sm">
                    <Spinner />
                    <p className="text-gray-300 mt-4 text-lg">AI 正在创作中...</p>
                </div>
            )}
            
            <div className="relative w-full h-full flex items-center justify-center">
                {currentImageUrl && (
                    <div className="relative">
                        <ReactCrop
                            crop={crop}
                            onChange={c => setCrop(c)}
                            onComplete={c => setCompletedCrop(c)}
                            aspect={aspect}
                            disabled={activeTab !== 'crop'}
                        >
                            <img
                                ref={imgRef}
                                src={isComparing && originalImageUrl ? originalImageUrl : currentImageUrl}
                                alt="可编辑图像"
                                onClick={handleImageClick}
                                className={`max-w-full max-h-[75vh] object-contain ${
                                    activeTab === 'retouch' ? 'cursor-crosshair' : 
                                    activeTab === 'crop' ? '' : // Let ReactCrop handle cursor
                                    'cursor-pointer'
                                }`}
                                title={activeTab !== 'retouch' && activeTab !== 'crop' ? '点击可全屏预览' : ''}
                            />
                        </ReactCrop>
                        
                        {displayHotspot && activeTab === 'retouch' && (
                            <div
                                className="absolute z-10 pointer-events-none"
                                style={{ left: displayHotspot.x, top: displayHotspot.y }}
                            >
                               <BullseyeIcon className="w-8 h-8 text-white/90 -translate-x-1/2 -translate-y-1/2 filter drop-shadow-lg" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Right Side: Control Panel */}
        <div className="lg:w-1/3 flex flex-col gap-4">
            
            {/* Main Toolbar */}
            <div className="flex items-center justify-between gap-2 bg-gray-800/50 border border-gray-700 rounded-lg p-2 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <button onClick={handleUndo} disabled={!canUndo || isLoading} className="p-3 bg-white/10 rounded-md text-gray-200 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Undo">
                        <UndoIcon className="w-5 h-5" />
                    </button>
                    <button onClick={handleRedo} disabled={!canRedo || isLoading} className="p-3 bg-white/10 rounded-md text-gray-200 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Redo">
                        <RedoIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleViewInNewTab}
                        disabled={isLoading || !currentImage}
                        className="p-3 bg-white/10 rounded-md text-gray-200 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="在新标签页中查看当前图片"
                        aria-label="View Current Image in New Tab"
                    >
                        <ExternalLinkIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={handleDownload}
                        disabled={isLoading || !currentImage}
                        className="p-3 bg-white/10 rounded-md text-gray-200 hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="下载当前图片"
                        aria-label="Download Image"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                    <button 
                        onMouseDown={() => setIsComparing(true)}
                        onMouseUp={() => setIsComparing(false)}
                        onTouchStart={() => setIsComparing(true)}
                        onTouchEnd={() => setIsComparing(false)}
                        disabled={isLoading} 
                        className="px-4 py-2 bg-white/10 rounded-md text-gray-200 hover:bg-white/20 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        <EyeIcon className="w-5 h-5" />
                        <span>按住比较</span>
                    </button>
                </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                    { id: 'retouch' as Tab, label: '精修', icon: MagicWandIcon },
                    { id: 'freestyle' as Tab, label: '自由', icon: SparklesIcon },
                    { id: 'background' as Tab, label: '背景', icon: LandscapeIcon },
                    { id: 'adjust' as Tab, label: '调整', icon: SunIcon },
                    { id: 'filters' as Tab, label: '滤镜', icon: PaletteIcon },
                    { id: 'crop' as Tab, label: '裁剪', icon: CropIcon },
                    { id: 'chat' as Tab, label: '聊天', icon: ChatIcon },
                ].map(({id, label, icon: Icon}) => (
                    <button 
                        key={id} 
                        onClick={() => setActiveTab(id)}
                        disabled={isLoading}
                        className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-all duration-200 text-sm font-semibold ${activeTab === id ? 'bg-gradient-to-br from-purple-600 to-pink-500 text-white shadow-md shadow-pink-500/20' : 'bg-white/10 text-gray-300 hover:bg-white/20'}`}
                    >
                       <Icon className="w-5 h-5" />
                       {label}
                    </button>
                ))}
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg animate-fade-in text-center">
                {error}
              </div>
            )}
            
            {/* Retouch Panel */}
            {activeTab === 'retouch' && (
              <div className="w-full bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex flex-col gap-4 animate-fade-in backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-center text-gray-300">AI 精准修图</h3>
                <p className="text-sm text-gray-400 text-center -mt-2">在图片上点击选择区域，然后描述您的修改。</p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="例如：'移除这个瑕疵' 或 '把这件衬衫变成红色'"
                  className="flex-grow bg-gray-800 border border-gray-600 text-gray-200 rounded-lg p-4 focus:ring-2 focus:ring-pink-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-base min-h-[80px]"
                  disabled={isLoading}
                  rows={3}
                />
                <button
                  onClick={handleGenerate}
                  className="w-full bg-gradient-to-br from-purple-600 to-pink-500 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-lg shadow-pink-500/20 hover:shadow-xl hover:shadow-pink-500/40 hover:-translate-y-px active:scale-95 active:shadow-inner text-base disabled:from-purple-800 disabled:to-pink-700 disabled:shadow-none disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isLoading || !prompt.trim() || !editHotspot}
                >
                  生成
                </button>
              </div>
            )}

            {activeTab === 'freestyle' && <FreestylePanel onApplyFreestyle={handleApplyFreestyle} isLoading={isLoading} />}
            {activeTab === 'background' && <BackgroundPanel onApplyBackground={handleApplyBackground} isLoading={isLoading} />}
            {activeTab === 'adjust' && <AdjustmentPanel onApplyAdjustment={handleApplyAdjustment} isLoading={isLoading} />}
            {activeTab === 'filters' && <FilterPanel onApplyFilter={handleApplyFilter} isLoading={isLoading} />}
            {activeTab === 'crop' && <CropPanel onApplyCrop={handleCrop} onSetAspect={setAspect} isLoading={isLoading} isCropping={!!completedCrop} />}
            {activeTab === 'chat' && <ChatPanel onSendMessage={handleSendMessage} chatHistory={chatHistory} isLoading={isChatLoading} />}

        </div>
    </div>
  ) : (
    <StartScreen onFileSelect={handleFileSelect} />
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center antialiased">
        <Header />
        <main className="w-full flex-grow flex items-center justify-center">
            {mainContent}
        </main>
        {isPreviewOpen && currentImageUrl && (
          <ImagePreviewModal
            imageUrl={currentImageUrl}
            onClose={() => setIsPreviewOpen(false)}
          />
        )}
    </div>
  );
};

export default App;