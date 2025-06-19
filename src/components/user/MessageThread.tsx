import React, { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageForm } from "./MessageForm";
import { cn } from "@/lib/utils";
import * as signalR from "@microsoft/signalr";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL;
const HUB_URL = `${API_URL}/chatHub`;

interface User {
  id: string;
  name: string;
  avatar: string | null;
}

interface Message {
  maTinNhan: number;
  nguoiGuiId: string;
  nguoiNhanId: string;
  noiDung: string;
  kieuTinNhan: "text" | "emoji" | "image";
  tepDinhKemUrl?: string;
  ngayTao: string;
  isPending?: boolean;
  sentTime?: string;
}

interface GiaoDien {
  maGiaoDien?: number;
  tenGiaoDien?: string;
  logo?: string;
  slider1?: string;
  slider2?: string;
  slider3?: string;
  slider4?: string;
  avt?: string;
  ngayTao?: string;
  trangThai?: number;
}

interface Props {
  threadId: string;
  user: User;
}

const fmtTime = (s: string) => {
  return new Date(s).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
};

export const MessageThread: React.FC<Props> = ({ threadId, user }) => {
  const me = localStorage.getItem("userId") || "";
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [scroll, setScroll] = useState(false);
  const [defaultAvatar, setDefaultAvatar] = useState<string | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | undefined>(undefined);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const [isPendingFile, setIsPendingFile] = useState<boolean>(false);
  const [isImageFile, setIsImageFile] = useState<boolean>(false);
  const [imageDisplayUrls, setImageDisplayUrls] = useState<{ [key: string]: string }>({});
  const lastRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const emojiList = ["😊", "😂", "❤️", "👍", "😍", "😢", "😡", "🎉", "🔥", "💯"];

  const fetchDefaultAvatar = async () => {
    try {
      const response = await fetch(`${API_URL}/api/GiaoDien`);
      if (!response.ok) throw new Error("Lỗi khi tải avatar mặc định");
      const data: GiaoDien[] = await response.json();
      const activeGiaoDien = data.find((item) => item.trangThai === 1);
      if (activeGiaoDien && activeGiaoDien.avt) {
        setDefaultAvatar(`data:image/png;base64,${activeGiaoDien.avt}`);
      } else {
        setDefaultAvatar(null);
      }
    } catch (err) {
      console.error("Lỗi khi lấy avatar mặc định:", (err as Error).message);
      setDefaultAvatar(null);
    }
  };

  const fetchImageAsBlob = async (url: string, token: string) => {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`Không thể tải hình ảnh từ ${url}`);
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Lỗi khi tải hình ảnh:", error);
      return "/fallback-image.png";
    }
  };

  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch(
          `${API_URL}/api/TinNhan/doan-chat?nguoiGuiId=${encodeURIComponent(me)}&nguoiNhanId=${encodeURIComponent(threadId)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error("Không thể tải tin nhắn");
        const data: Message[] = await res.json();
        setMsgs(data);

        const imageUrls: { [key: string]: string } = {};
        for (const msg of data) {
          if (msg.kieuTinNhan === "image" && msg.tepDinhKemUrl && !msg.isPending) {
            const imageUrl = await fetchImageAsBlob(`${API_URL}${msg.tepDinhKemUrl}`, token);
            imageUrls[msg.maTinNhan] = imageUrl;
          }
        }
        setImageDisplayUrls(imageUrls);
      } catch (error) {
        console.error("Lỗi khi tải tin nhắn:", error);
        setMsgs([]);
      } finally {
        setLoading(false);
        setScroll(true);
      }
    };

    fetchDefaultAvatar();
    fetchMessages();

    const hub = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => localStorage.getItem("token") || "" })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    hub
      .start()
      .then(() => console.log("Kết nối SignalR thành công"))
      .catch((err) => console.error("Lỗi kết nối SignalR:", err));

    hub.on("NhanTinNhan", async (m: Message) => {
      console.log("Tin nhắn nhận được từ SignalR:", m);
      setMsgs((prev) => {
        const pendingIndex = prev.findIndex(
          (msg) =>
            msg.isPending &&
            msg.nguoiGuiId === m.nguoiGuiId &&
            msg.nguoiNhanId === m.nguoiNhanId &&
            msg.noiDung === m.noiDung &&
            msg.sentTime &&
            Math.abs(new Date(msg.sentTime).getTime() - new Date(m.ngayTao).getTime()) < 5000
        );

        if (pendingIndex !== -1) {
          const updated = [...prev];
          updated[pendingIndex] = { ...m, isPending: false };
          console.log("Đã thay thế tin nhắn tạm thời:", updated[pendingIndex]);
          return updated;
        } else {
          const isRelevant =
            (m.nguoiGuiId === me && m.nguoiNhanId === threadId) ||
            (m.nguoiGuiId === threadId && m.nguoiNhanId === me);
          if (isRelevant) {
            console.log("Thêm tin nhắn mới:", m);
            return [...prev, m];
          }
          return prev;
        }
      });

      if (m.kieuTinNhan === "image" && m.tepDinhKemUrl && !m.isPending) {
        const token = localStorage.getItem("token") || "";
        const imageUrl = await fetchImageAsBlob(`${API_URL}${m.tepDinhKemUrl}`, token);
        setImageDisplayUrls((prev) => ({
          ...prev,
          [m.maTinNhan]: imageUrl,
        }));
      }

      setScroll(true);
    });

    return () => {
      hub.stop();
      Object.values(imageDisplayUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [threadId, me]);

  useEffect(() => {
    if (scroll) {
      lastRef.current?.scrollIntoView({ behavior: "smooth" });
      setScroll(false);
    }
  }, [msgs, scroll]);

  const handleNew = (content: string, file?: File) => {
    const now = new Date().toISOString();
    const msg: Message = {
      maTinNhan: Date.now(),
      nguoiGuiId: me,
      nguoiNhanId: threadId,
      noiDung: content,
      kieuTinNhan: file ? "image" : emojiList.includes(content) ? "emoji" : "text",
      tepDinhKemUrl: file ? URL.createObjectURL(file) : undefined,
      ngayTao: now,
      isPending: true,
      sentTime: now,
    };
    console.log("Thêm tin nhắn tạm thời:", msg);
    setMsgs((prev) => [...prev, msg]);
    setScroll(true);
  };

  const getFileExtension = (url?: string) => {
    if (!url) return "Tệp không xác định";
    const parts = url.split("/");
    const fileName = parts[parts.length - 1] || "Tệp không xác định";
    const lastUnderscoreIndex = fileName.lastIndexOf("_");
    if (lastUnderscoreIndex !== -1 && lastUnderscoreIndex < fileName.length - 1) {
      return fileName.substring(lastUnderscoreIndex + 1);
    }
    const dotIndex = fileName.lastIndexOf(".");
    if (dotIndex !== -1 && dotIndex < fileName.length - 1) {
      return fileName.substring(dotIndex + 1);
    }
    return fileName;
  };

  const openDownloadModal = (url?: string, isPending?: boolean, isImage?: boolean) => {
    if (!url) return;
    setSelectedFileUrl(url);
    setSelectedFileName(getFileExtension(url));
    setIsPendingFile(isPending || false);
    setIsImageFile(isImage || false);
    setDownloadModalOpen(true);
  };

  const handleFileDownload = async () => {
    if (!selectedFileUrl) return;

    try {
      if (isPendingFile) {
        const link = document.createElement("a");
        link.href = selectedFileUrl;
        link.download = selectedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const token = localStorage.getItem("token") || "";
        const response = await fetch(selectedFileUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) throw new Error("Không thể tải tệp từ server");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = selectedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Lỗi khi tải tệp:", error);
      alert("Không thể tải tệp. Vui lòng thử lại sau.");
    } finally {
      setDownloadModalOpen(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">Đang tải...</div>;

  return (
    <div className="flex flex-col h-full bg-[#f5f0ff] border border-[#9b87f5] rounded-xl overflow-hidden max-h-[calc(100vh-50px)]">
      <div className="flex items-center p-2 bg-[#f5f0ff] border-b border-[#9b87f5]/20">
        <Avatar
          className="h-10 w-10 mr-2 border border-[#9b87f5] cursor-pointer"
          onClick={() => navigate(`/user/profile/${user.id}`)}
        >
          {user.avatar ? (
            <AvatarImage src={user.avatar} />
          ) : defaultAvatar ? (
            <AvatarImage src={defaultAvatar} />
          ) : (
            <AvatarFallback>{user.name?.[0] || "?"}</AvatarFallback>
          )}
        </Avatar>
        <h3 className="text-[#9b87f5] font-semibold">{user.name}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ maxHeight: "calc(100vh - 150px)" }}>
        {msgs.map((m, i) => {
          const sent = m.nguoiGuiId === me;
          const isLast = i === msgs.length - 1;
          return (
            <div
              key={m.maTinNhan}
              ref={isLast ? lastRef : null}
              className={cn("flex", sent ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[70%] p-3 rounded-xl",
                  sent ? "bg-[#9b87f5] text-white" : "bg-white border border-[#9b87f5]/20 text-gray-800"
                )}
              >
                <p className={m.kieuTinNhan === "emoji" ? "text-2xl" : "text-sm"}>{m.noiDung}</p>
                {m.tepDinhKemUrl && (
                  m.kieuTinNhan === "image" ? (
                    <img
                      src={m.isPending ? m.tepDinhKemUrl : imageDisplayUrls[m.maTinNhan]}
                      alt="img"
                      className="mt-2 max-w-[200px] rounded cursor-pointer"
                      onClick={() => openDownloadModal(m.isPending ? m.tepDinhKemUrl : `${API_URL}${m.tepDinhKemUrl}`, m.isPending, true)}
                      onError={(e) => {
                        e.currentTarget.src = "/fallback-image.png";
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => openDownloadModal(m.isPending ? m.tepDinhKemUrl : `${API_URL}${m.tepDinhKemUrl}`, m.isPending, false)}
                      className={cn(
                        "mt-2 text-sm cursor-pointer hover:underline",
                        sent ? "text-white/90" : "text-blue-600"
                      )}
                    >
                      {getFileExtension(m.isPending ? m.tepDinhKemUrl : m.tepDinhKemUrl)}
                    </span>
                  )
                )}
                <div className={cn("text-xs mt-1", sent ? "text-white/80" : "text-gray-500")}>
                  {fmtTime(m.ngayTao)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-2 bg-[#f5f0ff] border-t border-[#9b87f5]/20 sticky bottom-0 z-10">
        <MessageForm recipientId={user.id} recipientName={user.name} onSuccess={handleNew} />
      </div>

      <Dialog open={downloadModalOpen} onOpenChange={setDownloadModalOpen}>
        <DialogContent className="p-6">
          <DialogHeader>
            <DialogTitle>Xác nhận tải xuống</DialogTitle>
            <DialogDescription>
              {isImageFile ? (
                <>
                  Bạn có muốn tải về hình ảnh này không?
                  <img
                    src={isPendingFile ? selectedFileUrl : imageDisplayUrls[msgs.find((m) => m.tepDinhKemUrl === selectedFileUrl)?.maTinNhan || ""]}
                    alt="Preview"
                    className="mt-2 max-w-[200px] rounded"
                    onError={(e) => {
                      e.currentTarget.src = "/fallback-image.png";
                    }}
                  />
                </>
              ) : (
                <>
                  Bạn có muốn tải về tệp <strong>{selectedFileName}</strong> không?
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline">Hủy</Button>
            </DialogClose>
            <Button onClick={handleFileDownload}>Đồng ý</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
