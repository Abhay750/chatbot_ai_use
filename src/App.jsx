import React, { useState, useEffect, useRef } from 'react';
import { Image as ImageIcon, MessageSquare, Send, Sparkles, Loader2, Bot, User, Download } from 'lucide-react';
import { HfInference } from "@huggingface/inference";

const TypewriterText = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;
    setDisplayedText('');
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 15);
    return () => clearInterval(timer);
  }, [text]);

  return <span className="animate-in fade-in duration-300">{displayedText}</span>;
};

export default function App() {
  const [activeTab, setActiveTab] = useState('text-to-image');
  const [imagePrompt, setImagePrompt] = useState('');
  const [textPrompt, setTextPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  
  // Output states
  const [generatedImage, setGeneratedImage] = useState(null);
  
  // Chat History
  const [chatHistory, setChatHistory] = useState([]);
  const messagesEndRef = useRef(null);

  // Initialize HuggingFace SDK client
  const hf = new HfInference(import.meta.env.VITE_HF_TOKEN);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isGeneratingText]);

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `Studio-AI-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleGenerateImage = async () => {
    if (!import.meta.env.VITE_HF_TOKEN) {
      alert("Missing API Token! Please add VITE_HF_TOKEN to your Vercel Environment Variables.");
      return;
    }
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const blob = await hf.textToImage({
        model: 'stabilityai/stable-diffusion-xl-base-1.0',
        inputs: imagePrompt,
      });

      const imageUrl = URL.createObjectURL(blob);
      setGeneratedImage(imageUrl);
    } catch (error) {
      console.error(error);
      alert("Failed to generate image: " + error.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleGenerateText = async () => {
    if (!import.meta.env.VITE_HF_TOKEN) {
      alert("Missing API Token! Please add VITE_HF_TOKEN to your Vercel Environment Variables.");
      return;
    }
    if (!textPrompt.trim()) return;
    
    // Add user message to UI immediately
    const userMessage = { role: 'user', content: textPrompt };
    setChatHistory((prev) => [...prev, userMessage]);
    
    const currentPrompt = textPrompt;
    setTextPrompt(''); // Clear input box
    setIsGeneratingText(true);
    
    try {
      // Build conversational history array (bot -> assistant for OpenAI format)
      const messages = chatHistory.map(msg => ({
        role: msg.role === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));
      // Append the latest prompt
      messages.push({ role: 'user', content: currentPrompt });

      const response = await hf.chatCompletion({
        model: 'Qwen/Qwen2.5-72B-Instruct',
        messages: messages,
      });

      const newText = response.choices[0]?.message?.content || "No response received.";
      
      // Append bot response
      setChatHistory((prev) => [...prev, { role: 'bot', content: newText }]);
    } catch (error) {
      console.error(error);
      alert("Failed to generate text: " + error.message);
    } finally {
      setIsGeneratingText(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#121216] to-[#1a1a2e] text-gray-100 flex flex-col items-center py-12 px-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-4xl space-y-10">
        
        {/* Header */}
        <div className="text-center space-y-4 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-2 ring-1 ring-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Sparkles className="w-8 h-8 text-indigo-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-500 drop-shadow-sm">
            AI Studio
          </h1>
          <p className="text-gray-400 text-lg font-medium">Create stunning images and intelligent text with AI.</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1.5 bg-black/40 rounded-2xl backdrop-blur-xl border border-white/5 w-fit mx-auto shadow-2xl relative">
          <button
            onClick={() => setActiveTab('text-to-image')}
            className={`relative flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ease-out ${
              activeTab === 'text-to-image'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {activeTab === 'text-to-image' && (
              <div className="absolute inset-0 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)] -z-10" />
            )}
            <ImageIcon className="w-4 h-4" />
            Text to Image
          </button>
          
          <button
            onClick={() => setActiveTab('text-to-text')}
            className={`relative flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ease-out ${
              activeTab === 'text-to-text'
                ? 'text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {activeTab === 'text-to-text' && (
              <div className="absolute inset-0 bg-indigo-600 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.5)] -z-10" />
            )}
            <MessageSquare className="w-4 h-4" />
            Text to Text
          </button>
        </div>

        {/* Main Content Area */}
        <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-6 text-base md:p-10 shadow-2xl backdrop-blur-3xl transition-all duration-500 min-h-[60vh] flex flex-col justify-between">
          
          {/* Text to Image Section */}
          {activeTab === 'text-to-image' && (
            <div className="space-y-8 flex-1 flex flex-col transition-all duration-500 ease-out opacity-100 translate-y-0">
              <div className="space-y-3 shrink-0">
                <label htmlFor="image-prompt" className="text-sm font-semibold text-gray-300 ml-1 block tracking-wide">
                  Describe your image
                </label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <input
                    id="image-prompt"
                    type="text"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    placeholder="A highly detailed celestial nebula, 8k resolution..."
                    className="relative w-full bg-[#111116] border border-white/10 rounded-2xl pl-5 pr-[150px] py-4.5 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 shadow-inner"
                  />
                  <button
                    onClick={handleGenerateImage}
                    disabled={!imagePrompt.trim() || isGeneratingImage}
                    className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:active:scale-100 disabled:bg-white/5 disabled:text-gray-600 disabled:hover:bg-white/5 text-white px-6 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center min-w-[130px] shadow-lg hover:shadow-indigo-500/25"
                  >
                    {isGeneratingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Generate'
                    )}
                  </button>
                </div>
              </div>

              {/* Enhanced Image Card Output & Controls */}
              <div className="w-full flex-1 flex flex-col gap-4 animate-in fade-in duration-500">
                <div className="relative w-full flex-1 rounded-3xl overflow-hidden bg-[#0d0d12] border border-white/5 flex items-center justify-center group shadow-2xl shadow-black/50 p-2 min-h-[300px] md:min-h-[450px]">
                  {isGeneratingImage ? (
                    // Skeleton pattern
                    <div className="w-full h-full min-h-[300px] md:min-h-[450px] rounded-2xl bg-[#15151e] animate-pulse flex flex-col items-center justify-center gap-5 border border-white/5 relative overflow-hidden">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                      <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                      <p className="text-sm font-medium text-indigo-300/80 uppercase tracking-widest animate-pulse">Rendering Matrix</p>
                    </div>
                  ) : generatedImage ? (
                    <div className="w-full h-full relative rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-700">
                      <img
                        src={generatedImage}
                        alt="Generated Output"
                        className="w-full h-full object-cover transition-transform duration-[2s] hover:scale-105"
                      />
                      {/* Image overlay grading */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                        <span className="text-white/80 font-medium text-sm tracking-wide bg-black/50 px-4 py-2 rounded-full backdrop-blur-md overflow-hidden text-ellipsis whitespace-nowrap max-w-[80%]">
                          {imagePrompt.length > 50 ? imagePrompt.substring(0, 50) + '...' : imagePrompt}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-5 text-gray-600 justify-center transition-all duration-300 hover:text-gray-500">
                      <div className="p-5 rounded-full bg-white/5 border border-white/5 group-hover:scale-110 transition-transform duration-500">
                        <ImageIcon className="w-12 h-12 stroke-[1.5]" />
                      </div>
                      <p className="text-sm font-medium">Your canvas awaits</p>
                    </div>
                  )}
                </div>

                {/* Download Button Component */}
                {generatedImage && !isGeneratingImage && (
                  <div className="flex justify-end pr-2 animate-in slide-in-from-bottom-4 fade-in duration-500">
                    <button
                      onClick={handleDownloadImage}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 bg-white/5 border border-white/10 hover:bg-white/10 text-white shadow-lg active:scale-95"
                    >
                      <Download className="w-4 h-4 text-indigo-400" />
                      Download Image
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Text to Text Section */}
          {activeTab === 'text-to-text' && (
            <div className="space-y-8 flex-1 flex flex-col transition-all duration-500 ease-out opacity-100 translate-y-0 max-h-[800px]">
              
              <div className="w-full flex-1 rounded-3xl bg-[#0d0d12] border border-white/5 shadow-2xl p-4 md:p-6 flex flex-col relative text-gray-200 min-h-[400px] max-h-[60vh]">
                
                {chatHistory.length === 0 ? (
                  // Empty State
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-500 opacity-80 h-full">
                     <div className="p-4 rounded-full bg-white/5 border border-white/5">
                        <MessageSquare className="w-10 h-10 stroke-[1.5]" />
                     </div>
                     <p className="text-sm font-medium">Start a conversation to see the response.</p>
                  </div>
                ) : (
                  // Chat flow output
                  <div className="flex-1 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pr-2">
                     
                     {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 animate-in fade-in ${msg.role === 'user' ? 'flex-row-reverse slide-in-from-right-8' : 'slide-in-from-left-8'}`}>
                          {msg.role === 'user' ? (
                            <>
                              <div className="shrink-0 bg-indigo-500/20 p-2.5 rounded-full ring-1 ring-indigo-500/30 mt-1">
                                <User className="w-5 h-5 text-indigo-300" />
                              </div>
                              <div className="bg-indigo-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[85%] shadow-md">
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="shrink-0 bg-purple-500/20 p-2.5 rounded-full ring-1 ring-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)] mt-1">
                                <Bot className="w-5 h-5 text-purple-300" />
                              </div>
                              <div className="bg-[#1a1a24] border border-white/10 text-gray-200 p-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md overflow-x-auto">
                                <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
                                  {/* Use Typewriter only for the very last message in the chat */}
                                  {index === chatHistory.length - 1 ? (
                                     <TypewriterText text={msg.content} />
                                  ) : (
                                     msg.content
                                  )}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                     ))}

                     {/* AI Loading Status */}
                     {isGeneratingText && (
                        <div className="flex items-start gap-4 animate-in slide-in-from-left-8 fade-in">
                          <div className="shrink-0 bg-purple-500/20 p-2.5 rounded-full ring-1 ring-purple-500/30 mt-1">
                            <Bot className="w-5 h-5 text-purple-300" />
                          </div>
                          <div className="bg-[#1a1a24] border border-white/10 text-gray-300 py-4 px-5 rounded-2xl rounded-tl-sm max-w-[85%] shadow-md flex items-center gap-2">
                             <div className="flex gap-1 items-center h-4">
                               <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                               <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                               <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                             </div>
                          </div>
                        </div>
                     )}
                     
                     <div ref={messagesEndRef} className="h-1" />
                  </div>
                )}
              </div>

              {/* Input section below like a chat */}
              <div className="space-y-3 shrink-0 pt-2 border-t border-white/5 relative z-10 w-full mt-auto">
                <div className="relative group flex gap-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-500"></div>
                  
                  <textarea
                    id="text-prompt"
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleGenerateText();
                      }
                    }}
                    placeholder="Ask me anything... (Press Enter to send)"
                    rows={1}
                    className="relative w-full bg-[#111116] border border-white/10 rounded-2xl px-5 py-4 text-gray-100 placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-300 shadow-inner resize-none min-h-[56px] leading-relaxed"
                  />
                  <button
                    onClick={handleGenerateText}
                    disabled={!textPrompt.trim() || isGeneratingText}
                    className="relative shrink-0 bg-indigo-600 hover:bg-indigo-500 active:scale-95 disabled:active:scale-100 disabled:bg-white/5 disabled:text-gray-600 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center min-w-[60px] shadow-lg hover:shadow-indigo-500/25 self-end"
                  >
                     <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>

            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
