import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Phone, Facebook, Send, Mail, ArrowUp, X, Menu, Loader2, MessageSquare } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

interface ApiResponse {
  responseCode: number;
  result: string;
  errorMessage?: string;
}

interface AddToCartRequest {
  maSanPham: string;
  soLuong: number;
}

const SupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [question, setQuestion] = useState<string>('');
  const [history, setHistory] = useState<{ question: string; result: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const iconContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedHistory = localStorage.getItem('supportChatHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('supportChatHistory', JSON.stringify(history));
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) {
      toast({
        title: "Không có nội dung",
        description: "Vui lòng nhập câu hỏi",
        variant: "destructive",
      });
      return;
    }

    if (isLoading) return;


    setIsLoading(true);
    try {
      const response = await axios.get<ApiResponse>(`http://localhost:5261/api/OpenAI/TraLoi?question=${encodeURIComponent(question)}`);
      const data = response.data;

      if (data.responseCode === 201 && data.result) {
        if (data.result.includes("Đã thêm sản phẩm")) {
          const match = question.match(/mã sản phẩm: (\w+),\s*số lượng: (\d+)/i);
          if (match) {
            const [, maSanPham, soLuong] = match;
            const cartRequest: AddToCartRequest = {
              maSanPham,
              soLuong: parseInt(soLuong),
            };
            const cartResponse = await axios.post<ApiResponse>('http://localhost:5261/api/OpenAI/ThemVaoGioHang', cartRequest);
            if (cartResponse.data.responseCode !== 201) {
              toast({
                title: "Lỗi thêm giỏ hàng",
                description: cartResponse.data.errorMessage || "Không thể thêm sản phẩm vào giỏ hàng",
                variant: "destructive",
              });
            }
          }
        }
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
    } finally {
      setIsLoading(false);
    }
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
        <button
          onClick={toggleIcons}
          className="bg-[#c083fc] hover:bg-[#b36bf7] text-white rounded-full p-3 shadow-lg"
        >
          {showIcons ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {showIcons && (
          <>
            <a
              href="tel:+84383777823"
              className="flex items-center gap-2 bg-[#4CAF50] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Gọi điện</span>
              <Phone className="w-5 h-5" />
            </a>

            <a
              href="https://zalo.me/383777823"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0088FF] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Zalo</span>
              <MessageSquare className="w-5 h-5" />
            </a>

            <a
              href="https://facebook.com/Thien2k5"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1877F2] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Facebook</span>
              <Facebook className="w-5 h-5" />
            </a>

            <a
              href="https://t.me/miyaru2k5"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0088CC] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Telegram</span>
              <Send className="w-5 h-5" />
            </a>

            <a
              href="mailto:nguyenhuythien9a1@gmail.com"
              className="flex items-center gap-2 bg-[#D44638] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Email</span>
              <Mail className="w-5 h-5" />
            </a>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-[#c083fc] text-white rounded-full px-4 py-2 shadow-lg"
            >
              <span>Chat</span>
              <MessageCircle className="w-5 h-5" />
            </button>

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
              <div>
                {history.map((msg, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-end">
                      <div className="bg-[#c083fc] text-white p-2 rounded-lg max-w-[70%]">
                        <p className="text-sm">{msg.question}</p>
                      </div>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded-lg max-w-[70%]">
                        <div
                          className="text-sm prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: msg.result }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatContainerRef} />
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t flex items-center gap-2 bg-white dark:bg-gray-800">
            <Input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Nhập câu hỏi của bạn"
              className="dark:bg-gray-700 dark:text-white"
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="bg-[#c083fc] text-white hover:bg-[#b36bf7]"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
};

export default SupportChat;