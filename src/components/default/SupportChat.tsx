import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Volume2, VolumeX, MessageCircle, Phone, ArrowUp, X, Menu } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import CryptoJS from 'crypto-js';
import { toByteArray } from 'base64-js';
import { cn } from "@/lib/utils";

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
  length: number;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

interface ApiResponse {
  responseCode: number;
  result: string;
  errorMessage?: string;
}

const SupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [question, setQuestion] = useState<string>('');
  const [history, setHistory] = useState<{ question: string; result: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isListeningRef = useRef(isListening);
  const iconContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const API_KEY = "ba3f1541d8c7ca7d782cf9c324aeeaca";
  const API_SECRET = "a68bb7419e7121dbb393d73f0c154bf4";

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor() as SpeechRecognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'vi-VN';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setQuestion(transcript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        toast({
          title: "Lỗi nhận diện giọng nói",
          description: `Không thể nhận diện giọng nói: ${event.error}`,
          variant: "destructive",
        });
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          recognition.start();
        }
      };

      speechRecognitionRef.current = recognition;
    }

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, [toast]);

  useEffect(() => {
    const savedHistory = localStorage.getItem('supportChatHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('supportChatHistory', JSON.stringify(history));
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast({
        title: "Không có nội dung",
        description: "Vui lòng nhập câu hỏi hoặc sử dụng tính năng ghi âm",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await axios.get<ApiResponse>(`http://localhost:5261/api/Gemini/SmartAI?input=${encodeURIComponent(question)}`);
      const data = response.data;

      if (data.responseCode === 201 && data.result) {
        const newMessage = { question, result: data.result };
        setHistory([...history, newMessage]);
        setQuestion('');
      } else {
        toast({
          title: "Lỗi từ server",
          description: data.errorMessage || "Có lỗi xảy ra",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến server",
        variant: "destructive",
      });
    }
  };

  const toggleListening = () => {
    if (!speechRecognitionRef.current) {
      toast({
        title: "Không hỗ trợ",
        description: "Trình duyệt của bạn không hỗ trợ nhận diện giọng nói",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    } else {
      speechRecognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "Đang lắng nghe",
        description: "Hãy nói câu hỏi của bạn",
      });
    }
  };

  const assembleAuthUrl = (hostUrl: string, apiKey: string, apiSecret: string) => {
    const date = new Date().toUTCString();
    const host = new URL(hostUrl).host;
    const requestLine = "GET /v2/tts HTTP/1.1";
    const signatureOrigin = `host: ${host}\ndate: ${date}\n${requestLine}`;
    const signatureSha = CryptoJS.HmacSHA256(signatureOrigin, apiSecret);
    const signature = CryptoJS.enc.Base64.stringify(signatureSha);
    const authorizationOrigin = `api_key="${apiKey}",algorithm="hmac-sha256",headers="host date request-line",signature="${signature}"`;
    const authorization = btoa(authorizationOrigin);
    return `${hostUrl}?host=${encodeURIComponent(host)}&date=${encodeURIComponent(date)}&authorization=${encodeURIComponent(authorization)}`;
  };

  const encodeTextToBase64 = (text: string): string => {
    const encoder = new TextEncoder();
    const utf8Bytes = encoder.encode(text);
    const binaryString = String.fromCharCode(...utf8Bytes);
    return btoa(binaryString);
  };

  const cleanTextForTTS = (htmlText: string): string => {
    const div = document.createElement('div');
    div.innerHTML = htmlText;
    const styles = div.getElementsByTagName('style');
    while (styles.length > 0) {
      styles[0].parentNode?.removeChild(styles[0]);
    }
    let cleanText = div.textContent || div.innerText || '';
    cleanText = cleanText.replace(/Xem chi tiết sản phẩm/g, '');
    cleanText = cleanText.replace(/\s*\(#[0-9A-Fa-f]{6}\)/g, '');
    cleanText = cleanText.replace(/\n\s*\n/g, '\n').replace(/\s+/g, ' ').trim();
    return cleanText;
  };

  const speakText = (text: string) => {
    if (!text || !text.trim()) {
      toast({
        title: "Lỗi dữ liệu",
        description: "Vui lòng cung cấp nội dung để tổng hợp giọng nói",
        variant: "destructive",
      });
      return;
    }

    const cleanText = cleanTextForTTS(text);
    const wsUrl = assembleAuthUrl('wss://tts-api-sg.xf-yun.com/v2/tts', API_KEY, API_SECRET);
    websocketRef.current = new WebSocket(wsUrl);

    websocketRef.current.onopen = () => {
      const requestData = {
        common: { app_id: "ga62eb2a" },
        business: {
          vcn: "xiaoyun",
          aue: "lame",
          speed: 50,
          volume: 50,
          pitch: 50,
          tte: "UTF8",
        },
        data: {
          status: 2,
          text: encodeTextToBase64(cleanText),
        },
      };
      websocketRef.current?.send(JSON.stringify(requestData));
      setIsSpeaking(true);
    };

    websocketRef.current.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response.code === 0 && response.data.audio) {
        const audioData = toByteArray(response.data.audio);
        const blob = new Blob([audioData], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        audioRef.current = new Audio(url);
        audioRef.current.onended = () => setIsSpeaking(false);
        audioRef.current.play();
      } else {
        toast({
          title: "Lỗi tổng hợp giọng nói",
          description: response.message || "Không thể tổng hợp giọng nói",
          variant: "destructive",
        });
        setIsSpeaking(false);
      }
    };

    websocketRef.current.onerror = () => {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến iFLYTEK TTS",
        variant: "destructive",
      });
      setIsSpeaking(false);
    };
  };

  const stopSpeaking = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (websocketRef.current) {
      websocketRef.current.close();
    }
    setIsSpeaking(false);
  };

  const toggleIcons = () => {
    setShowIcons(!showIcons);
  };

  return (
    <>
      <div
        ref={iconContainerRef}
        className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      >
        {/* Toggle Button for Social Media List */}
        <button
          onClick={toggleIcons}
          className="bg-[#c083fc] hover:bg-[#b36bf7] text-white rounded-full p-3 shadow-lg"
        >
          {showIcons ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {showIcons && (
          <>
            {/* Phone Button */}
            <a
              href="tel:+84383777823"
              className="flex items-center gap-2 bg-[#4CAF50] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Gọi điện</span>
              <Phone className="w-5 h-5" />
            </a>

            {/* Zalo Button */}
            <a
              href="https://zalo.me/383777823"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0088FF] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Zalo</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22.5c-5.79 0-10.5-4.71-10.5-10.5S6.21 1.5 12 1.5s10.5 4.71 10.5 10.5S17.79 22.5 12 22.5zm3.75-6.75h-7.5v1.5h7.5v-1.5zm-7.5-3h7.5v1.5h-7.5v-1.5zm0-3h7.5v1.5h-7.5v-1.5zm0-3h7.5v1.5h-7.5v-1.5z" />
              </svg>
            </a>

            {/* Facebook Button */}
            <a
              href="https://facebook.com/Thien2k5"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Facebook</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.75 18.75h-3v-7.5h1.5l.75-1.5h-2.25v-1.5c0-.621.504-1.125 1.125-1.125h1.125V6h-1.5c-1.657 0-3 1.343-3 3v1.5h-1.5v1.5h1.5v7.5h-3v-3h-1.5v3c0 1.657 1.343 3 3 3h6c1.657 0 3-1.343 3-3v-3h-1.5v1.5z" />
              </svg>
            </a>

            {/* Telegram Button */}
            <a
              href="https://t.me/miyaru2k5"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0088CC] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Telegram</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 17.245s-.441.441-.882.441-.735-.294-.882-.588c-1.029-2.059-3.382-7.5-3.382-7.5l3.529-1.176 1.176-4.412s.147-.147.294 0 .147.294.147.294l-2.059 7.353 3.529 1.176s.441.294.441.588zm-7.5 1.176s-.294.294-.588.294-.588-.294-.588-.588v-4.412l-2.647-1.176-1.029 3.529s-.147.294-.441.294-.294-.147-.294-.294l1.176-4.412-2.353-1.176s-.147-.294 0-.441c.147-.147.294-.147.441 0l3.529 1.176 1.176-4.412s.147-.294.294-.147c.147.147.147.294 0 .441l-2.059 7.353v4.412z" />
              </svg>
            </a>

            {/* Email Button */}
            <a
              href="mailto:nguyenhuythien9a1@gmail.com"
              className="flex items-center gap-2 bg-[#D44638] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Email</span>
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 4.5c4.142 0 7.5 3.358 7.5 7.5s-3.358 7.5-7.5 7.5-7.5-3.358-7.5-7.5S7.858 4.5 12 4.5zm0 3v1.5l3.75 2.25-3.75 2.25v1.5l5.25-3.15z" />
              </svg>
            </a>

            {/* Chat Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-[#c083fc] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Chat</span>
              <MessageCircle className="w-5 h-5" />
            </button>

            {/* Scroll to Top Button */}
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 bg-gray-500 text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Lên đầu trang</span>
              <ArrowUp className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {isOpen && (
        <div
          className={cn(
            "fixed bottom-16 right-4 w-96",
            "bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-[#c083fc]",
            "flex flex-col h-[400px] z-50"
          )}
        >
          <div className="p-3 bg-[#c083fc] text-white rounded-t-lg flex items-center justify-between">
            <h3 className="font-semibold">FashionHub</h3>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-[#b36bf7]"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-gray-800">
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                Chưa có tin nhắn nào. Hãy đặt câu hỏi!
              </div>
            ) : (
              history.map((msg, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-end">
                    <div className="bg-[#c083fc] text-white p-2 rounded-lg max-w-[70%]">
                      <p className="text-sm">{msg.question}</p>
                    </div>
                  </div>
                  <div className="flex justify-start items-center gap-2">
                    <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded-lg max-w-[70%]">
                      <div
                        className="text-sm prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: msg.result }}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-[#c083fc]"
                      onClick={() => (isSpeaking ? stopSpeaking() : speakText(msg.result))}
                    >
                      {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t flex items-center gap-2 bg-white dark:bg-gray-800">
            <div className="relative flex-1">
              <Input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Nhập câu hỏi của bạn"
                className="pr-8 dark:bg-gray-700 dark:text-white"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full text-[#c083fc]"
                onClick={toggleListening}
              >
                {isListening ? <MicOff className="h-4 w-4 text-destructive" /> : <Mic className="h-4 w-4" />}
              </Button>
            </div>
            <Button type="submit" className="bg-[#c083fc] text-white hover:bg-[#b36bf7]">
              Gửi
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default SupportChat;