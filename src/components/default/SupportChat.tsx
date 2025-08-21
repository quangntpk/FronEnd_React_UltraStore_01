import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  MessageCircle,
  Phone,
  Facebook,
  Send,
  ArrowUp,
  X,
  Menu,
  Loader2,
  MessageSquare,
  Bot,
  Search,
  ShoppingCart,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { cn } from "@/lib/utils";

interface ApiResponse {
  generatedText?: string;
  message: string;
  success?: boolean;
}

interface ChatMode {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface RequestData {
  textPrompt: string;
  IDSanPham?: string;
  MauSac?: string;
  KichThuoc?: string;
  SoLuong?: number;
  IDNguoiDung?: string;
}

const SupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showIcons, setShowIcons] = useState(false);
  const [question, setQuestion] = useState<string>('');
  const [cartForm, setCartForm] = useState({
    IDSanPham: '',
    MauSac: '',
    KichThuoc: '',
    SoLuong: '',
    IDNguoiDung: '',
  });
  const [history, setHistory] = useState<{ question: string; result: string; mode: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [selectedMode, setSelectedMode] = useState<string>('ai');
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [position, setPosition] = useState<Position>({ x: window.innerWidth - 384 - 16, y: 64 });
  const [size, setSize] = useState<Size>({ width: 384, height: 600 });
  const [defaultSize] = useState<Size>({ width: 384, height: 600 });
  const [resizeStart, setResizeStart] = useState<{ mouse: Position; size: Size }>({
    mouse: { x: 0, y: 0 },
    size: { width: 384, height: 600 },
  });

  const iconContainerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatWindowRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const modeSelectorRef = useRef<HTMLDivElement>(null);

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userData.maNguoiDung || '';

  const chatModes: ChatMode[] = [
    {
      id: 'ai',
      name: 'Trả lời AI',
      icon: <Bot className="w-4 h-4" />,
      color: 'text-blue-600',
    },
    {
      id: 'search',
      name: 'Tìm kiếm sản phẩm',
      icon: <Search className="w-4 h-4" />,
      color: 'text-green-600',
    },
    ...(isLoggedIn
      ? [
          {
            id: 'cart',
            name: 'Thêm vào giỏ hàng',
            icon: <ShoppingCart className="w-4 h-4" />,
            color: 'text-orange-600',
          },
        ]
      : []),
  ];

  const currentMode = chatModes.find((mode) => mode.id === selectedMode) || chatModes[0];

  useEffect(() => {
    const savedHistory = localStorage.getItem('supportChatHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
    if (isLoggedIn) {
      setCartForm((prev) => ({ ...prev, IDNguoiDung: userId }));
    }
  }, [isLoggedIn, userId]);

  useEffect(() => {
    localStorage.setItem('supportChatHistory', JSON.stringify(history));
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [history]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modeSelectorRef.current && !modeSelectorRef.current.contains(e.target as Node)) {
        setShowModeSelector(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    },
    [position],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
      }

      if (isResizing && !isMaximized) {
        const deltaX = e.clientX - resizeStart.mouse.x;
        const deltaY = e.clientY - resizeStart.mouse.y;

        const newWidth = Math.max(300, Math.min(window.innerWidth - position.x, resizeStart.size.width + deltaX));
        const newHeight = Math.max(400, Math.min(window.innerHeight - position.y, resizeStart.size.height + deltaY));

        setSize({ width: newWidth, height: newHeight });
      }
    },
    [isDragging, isResizing, dragStart, resizeStart, position, isMaximized, size.width, size.height],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      setResizeStart({
        mouse: { x: e.clientX, y: e.clientY },
        size: { width: size.width, height: size.height },
      });
    },
    [size, isMaximized],
  );

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    let requestText = question;
    let requestData: RequestData = { textPrompt: question };

    if (selectedMode === 'cart') {
      const { IDSanPham, MauSac, KichThuoc, SoLuong, IDNguoiDung } = cartForm;
      if (!IDSanPham || !MauSac || !KichThuoc || !SoLuong) {
        setHistory((prev) => [
          ...prev,
          {
            question: requestText || 'Thêm vào giỏ hàng',
            result: 'Lỗi: Vui lòng điền đầy đủ tất cả các trường.',
            mode: selectedMode,
          },
        ]);
        return;
      }

      const soLuongNum = parseInt(SoLuong, 10);
      if (isNaN(soLuongNum) || soLuongNum <= 0) {
        setHistory((prev) => [
          ...prev,
          {
            question: requestText || 'Thêm vào giỏ hàng',
            result: 'Lỗi: Số lượng phải là một số nguyên dương.',
            mode: selectedMode,
          },
        ]);
        return;
      }

      if (IDNguoiDung !== userId) {
        setHistory((prev) => [
          ...prev,
          {
            question: requestText || 'Thêm vào giỏ hàng',
            result: 'Lỗi: Mã người dùng không khớp với tài khoản đăng nhập.',
            mode: selectedMode,
          },
        ]);
        return;
      }

      requestText = `Thêm sản phẩm ${IDSanPham}, màu ${MauSac}, kích thước ${KichThuoc}, số lượng ${SoLuong}, khách hàng ${IDNguoiDung}`;
      requestData = {
        textPrompt: requestText,
        IDSanPham,
        MauSac,
        KichThuoc,
        SoLuong: soLuongNum,
        IDNguoiDung,
      };
    } else if (!question.trim()) {
      setHistory((prev) => [
        ...prev,
        {
          question: requestText || 'Câu hỏi',
          result: 'Lỗi: Vui lòng nhập câu hỏi hoặc thông tin sản phẩm.',
          mode: selectedMode,
        },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      let endpoint = '';
      switch (selectedMode) {
        case 'ai':
          endpoint = 'generate-text';
          break;
        case 'search':
          endpoint = 'search-products';
          break;
        case 'cart':
          endpoint = 'add-to-cart';
          break;
        default:
          throw new Error('Chế độ không hợp lệ');
      }

      const response = await axios.post<ApiResponse>(
        `https://localhost:7051/api/GoogleApis/${endpoint}`,
        requestData,
        {
          headers: {
            ...(selectedMode === 'cart' ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data;

      if (selectedMode === 'cart' ? data.success : data.generatedText) {
        const result = selectedMode === 'cart' ? data.message : data.generatedText!;
        const newMessage = {
          question: requestText,
          result: selectedMode === 'cart' ? 'Thành công: Đã thêm sản phẩm vào giỏ hàng!' : result,
          mode: selectedMode,
        };
        const updatedHistory = [...history, newMessage];
        setHistory(updatedHistory);
        setQuestion('');
        if (selectedMode === 'cart') {
          setCartForm({
            IDSanPham: '',
            MauSac: '',
            KichThuoc: '',
            SoLuong: '',
            IDNguoiDung: userId,
          });
        }
      } else {
        setHistory((prev) => [
          ...prev,
          {
            question: requestText,
            result: `${data.message || 'Không nhận được câu trả lời từ server.'}`,
            mode: selectedMode,
          },
        ]);
      }
    } catch (err: any) {
      setHistory((prev) => [
        ...prev,
        {
          question: requestText,
          result: `Lỗi kết nối: ${err.response?.data?.message || err.message || 'Không thể kết nối đến server.'}`,
          mode: selectedMode,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIcons = () => {
    setShowIcons(!showIcons);
    if (showIcons) setIsOpen(false);
  };

  const handleModeSelect = (modeId: string) => {
    setSelectedMode(modeId);
    setShowModeSelector(false);
    setQuestion('');
    if (modeId === 'cart') {
      setCartForm((prev) => ({ ...prev, IDNguoiDung: userId }));
    }
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setSize(defaultSize);
      setPosition({ x: window.innerWidth - defaultSize.width - 16, y: 64 });
    } else {
      setSize({ width: window.innerWidth - 32, height: window.innerHeight - 96 });
      setPosition({ x: 16, y: 64 });
    }
    setIsMaximized(!isMaximized);
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [question]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <>
      <div
        ref={iconContainerRef}
        className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2"
      >
        <button
          onClick={toggleIcons}
          className="bg-[#c083fc] hover:bg-[#b36bf7] text-white rounded-full p-3 shadow-lg transition-colors duration-200"
          aria-label={showIcons ? 'Đóng menu hỗ trợ' : 'Mở menu hỗ trợ'}
        >
          {showIcons ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {showIcons && (
          <div className="flex flex-col gap-2 animate-in slide-in-from-bottom duration-300">
            <a
              href="tel:+84383777823"
              className="flex items-center gap-2 bg-[#4CAF50] hover:bg-[#45a049] text-white rounded-full px-4 py-2 shadow-lg transition-colors duration-200"
              aria-label="Gọi điện hỗ trợ"
            >
              <span>Gọi điện</span>
              <Phone className="w-5 h-5" />
            </a>

            <a
              href="https://zalo.me/383777823"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0088FF] hover:bg-[#0077dd] text-white rounded-full px-4 py-2 shadow-lg transition-colors duration-200"
              aria-label="Liên hệ qua Zalo"
            >
              <span>Zalo</span>
              <MessageSquare className="w-5 h-5" />
            </a>

            <a
              href="https://facebook.com/Thien2k5"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-full px-4 py-2 shadow-lg transition-colors duration-200"
              aria-label="Liên hệ qua Facebook"
            >
              <span>Facebook</span>
              <Facebook className="w-5 h-5" />
            </a>

            <a
              href="https://t.me/miyaru2k5"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#0088CC] hover:bg-[#0077bb] text-white rounded-full px-4 py-2 shadow-lg transition-colors duration-200"
              aria-label="Liên hệ qua Telegram"
            >
              <span>Telegram</span>
              <Send className="w-5 h-5" />
            </a>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 bg-[#c083fc] hover:bg-[#b36bf7] text-white rounded-full px-4 py-2 shadow-lg transition-colors duration-200"
              aria-label={isOpen ? 'Đóng chat hỗ trợ' : 'Mở chat hỗ trợ'}
            >
              <span>Chat</span>
              <MessageCircle className="w-5 h-5" />
            </button>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full px-4 py-2 shadow-lg transition-colors duration-200"
              aria-label="Cuộn lên đầu trang"
            >
              <span>Lên đầu</span>
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          ref={chatWindowRef}
          className={cn(
            'fixed z-50',
            'bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-[#c083fc]',
            'flex flex-col overflow-hidden',
            isDragging && !isMaximized && 'cursor-move',
            isResizing && !isMaximized && 'cursor-nw-resize',
          )}
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: `${size.width}px`,
            height: `${size.height}px`,
            minWidth: '300px',
            minHeight: '400px',
          }}
        >
          <div
            className="p-3 bg-[#c083fc] text-white rounded-t-lg flex items-center justify-between cursor-move drag-handle"
            onMouseDown={handleMouseDown}
            aria-label="Kéo để di chuyển cửa sổ chat"
          >
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">FashionHub</h3>
              <span className="text-xs opacity-80">- {currentMode.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-[#b36bf7] h-6 w-6"
                onClick={toggleMaximize}
                aria-label={isMaximized ? 'Thu nhỏ cửa sổ chat' : 'Phóng to cửa sổ chat'}
              >
                {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-[#b36bf7] h-6 w-6"
                onClick={() => setIsOpen(false)}
                aria-label="Đóng cửa sổ chat"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-white dark:bg-gray-800">
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                <div className={cn('inline-flex items-center gap-2 mb-2', currentMode.color)}>
                  {currentMode.icon}
                  <span className="font-medium">Chế độ: {currentMode.name}</span>
                </div>
                <p>Chưa có tin nhắn nào. Hãy đặt câu hỏi hoặc thêm sản phẩm!</p>
              </div>
            ) : (
              <div>
                {history.map((msg, index) => {
                  const msgMode = chatModes.find((m) => m.id === msg.mode) || chatModes[0];
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-end">
                        <div className="bg-[#c083fc] text-white p-2 rounded-lg max-w-[70%]">
                          <p className="text-sm">{msg.question}</p>
                        </div>
                      </div>
                      <div className="flex justify-start">
                        <div className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 p-2 rounded-lg max-w-[70%]">
                          <div className="flex items-center gap-1 mb-1 opacity-80">
                            {msgMode.icon}
                            <span className="text-xs">{msgMode.name}</span>
                          </div>
                          <div
                            className="text-sm prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: msg.result.replace(/\n/g, '<br />'),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatContainerRef} />
              </div>
            )}
          </div>

          <form
            className="p-3 border-t bg-white dark:bg-gray-800"
            onSubmit={handleSubmit}
          >
            {selectedMode === 'cart' ? (
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Input
                  value={cartForm.IDSanPham}
                  onChange={(e) => setCartForm({ ...cartForm, IDSanPham: e.target.value })}
                  placeholder="Mã sản phẩm"
                  className="dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                  aria-label="Mã sản phẩm"
                />
                <Input
                  value={cartForm.MauSac}
                  onChange={(e) => setCartForm({ ...cartForm, MauSac: e.target.value })}
                  placeholder="Mã màu"
                  className="dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                  aria-label="Mã màu"
                />
                <Input
                  value={cartForm.KichThuoc}
                  onChange={(e) => setCartForm({ ...cartForm, KichThuoc: e.target.value })}
                  placeholder="Kích thước"
                  className="dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                  aria-label="Kích thước"
                />
                <Input
                  type="number"
                  value={cartForm.SoLuong}
                  onChange={(e) => setCartForm({ ...cartForm, SoLuong: e.target.value })}
                  placeholder="Số lượng"
                  className="dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                  aria-label="Số lượng"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="relative" ref={modeSelectorRef}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn('h-10 w-10 flex-shrink-0', currentMode.color)}
                    onClick={() => setShowModeSelector(!showModeSelector)}
                    aria-label="Chọn chế độ chat"
                  >
                    {currentMode.icon}
                  </Button>
                  {showModeSelector && (
                    <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 border rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
                      {chatModes.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          className={cn(
                            'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2',
                            selectedMode === mode.id && 'bg-gray-100 dark:bg-gray-700',
                            mode.color,
                          )}
                          onClick={() => handleModeSelect(mode.id)}
                          aria-label={`Chọn chế độ ${mode.name}`}
                        >
                          {mode.icon}
                          <span className="text-sm">{mode.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Textarea
                  ref={textareaRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedMode === 'ai'
                      ? 'Nhập câu hỏi của bạn'
                      : 'Nhập sản phẩm cần tìm (VD: áo sơ mi xanh size M)'
                  }
                  className="dark:bg-gray-700 dark:text-white flex-1 resize-none min-h-[40px] max-h-[120px]"
                  disabled={isLoading}
                  aria-label="Nhập nội dung chat"
                />
                <Button
                  type="submit"
                  className="bg-[#c083fc] text-white hover:bg-[#b36bf7] flex-shrink-0 h-10 w-10"
                  disabled={isLoading}
                  aria-label="Gửi tin nhắn"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            )}
            {selectedMode === 'cart' && (
              <div className="flex items-center gap-2 mt-2">
                <div className="relative" ref={modeSelectorRef}>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn('h-10 w-10 flex-shrink-0', currentMode.color)}
                    onClick={() => setShowModeSelector(!showModeSelector)}
                    aria-label="Chọn chế độ chat"
                  >
                    {currentMode.icon}
                  </Button>
                  {showModeSelector && (
                    <div className="absolute bottom-12 left-0 bg-white dark:bg-gray-800 border rounded-lg shadow-lg py-1 z-10 min-w-[180px]">
                      {chatModes.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          className={cn(
                            'w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2',
                            selectedMode === mode.id && 'bg-gray-100 dark:bg-gray-700',
                            mode.color,
                          )}
                          onClick={() => handleModeSelect(mode.id)}
                          aria-label={`Chọn chế độ ${mode.name}`}
                        >
                          {mode.icon}
                          <span className="text-sm">{mode.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="submit"
                  className="bg-[#c083fc] text-white hover:bg-[#b36bf7] flex-shrink-0 h-10 w-10"
                  disabled={isLoading}
                  aria-label="Gửi tin nhắn"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
            )}
          </form>

          {!isMaximized && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-nw-resize opacity-50 hover:opacity-100"
              onMouseDown={handleResizeStart}
              aria-label="Thay đổi kích thước cửa sổ chat"
            >
              <div className="absolute bottom-1 right-1 w-0 h-0 border-l-4 border-b-4 border-gray-400"></div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default SupportChat;