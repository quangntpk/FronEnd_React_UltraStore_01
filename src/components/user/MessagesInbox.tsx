import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search } from "lucide-react";
import * as signalR from "@microsoft/signalr";
import { MessageThread } from "./MessageThread";

// ====== Interface Props ======
interface MessagesInboxProps {
  recipientId?: string;
  recipientName?: string;
}

// ====== Interface Data Models ======
interface NguoiDung {
  maNguoiDung: string;
  hoTen: string;
  hinhAnh: string | null;
}

interface Thread {
  id: string;
  user: { id: string; name: string; avatar: string | null };
  lastMessage: { content: string; timestamp: string; isRead: boolean };
}

interface UserSearchResult {
  id: string;
  name: string;
  avatar: string | null;
}

interface ThreadView {
  maTinNhan: number;
  nguoiGuiId: string;
  nguoiNhanId: string;
  noiDung: string;
  ngayTao: string;
  tepDinhKemUrl?: string;
  kieuTinNhan?: string;
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

const API_URL = import.meta.env.VITE_API_URL;

// ====== Component ======
export const MessagesInbox: React.FC<MessagesInboxProps> = ({
  recipientId,
  recipientName,
}) => {
  const me = localStorage.getItem("userId") || "";
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [defaultAvatar, setDefaultAvatar] = useState<string | null>(null); // Thêm state cho avatar mặc định

  // ====== Lấy avatar mặc định từ API giao diện hoạt động ======
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

  // Gọi API lấy avatar mặc định khi component mount
  useEffect(() => {
    fetchDefaultAvatar();
  }, []);

  // ====== Load threads từ API ======
  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/TinNhan/threads?userId=${encodeURIComponent(me)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("Không thể tải threads");
        const data: ThreadView[] = await response.json();

        const mapThreads = await Promise.all(
          data.map(async (t) => {
            const other = t.nguoiGuiId === me ? t.nguoiNhanId : t.nguoiGuiId;
            const userResponse = await fetch(
              `${import.meta.env.VITE_API_URL}/api/NguoiDung?searchTerm=${encodeURIComponent(other)}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const users: NguoiDung[] = userResponse.ok ? await userResponse.json() : [];
            const user = users.find((x) => x.maNguoiDung === other);

            return {
              id: other,
              user: {
                id: other,
                name: user?.hoTen || other,
                avatar: user?.hinhAnh ? `data:image/png;base64,${user.hinhAnh}` : null,
              },
              lastMessage: {
                content: t.noiDung,
                timestamp: t.ngayTao,
                isRead: true,
              },
            } as Thread;
          })
        );

        setThreads(mapThreads);

        // Chọn người nhận mặc định nếu có recipientId
        if (recipientId) {
          const existing = mapThreads.find((t) => t.id === recipientId);
          if (!existing && recipientName) {
            setThreads([
              {
                id: recipientId,
                user: { id: recipientId, name: recipientName, avatar: null },
                lastMessage: { content: "", timestamp: new Date().toISOString(), isRead: true },
              },
              ...mapThreads,
            ]);
          }
          setSelected(recipientId);
        }
      } catch (error) {
        console.error("Lỗi khi tải threads:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [me, recipientId, recipientName]);

  // ====== SignalR cho tin nhắn thời gian thực ======
  useEffect(() => {
    const hub = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL}/chatHub`, {
        accessTokenFactory: () => localStorage.getItem("token") || "",
      })
      .withAutomaticReconnect()
      .build();

    hub
      .start()
      .then(() => console.log("Kết nối SignalR thành công"))
      .catch((err) => console.error("Lỗi kết nối SignalR:", err));

    hub.on("NhanTinNhan", (t: ThreadView) => {
      const other = t.nguoiGuiId === me ? t.nguoiNhanId : t.nguoiGuiId;
      setThreads((prev) =>
        prev.some((th) => th.id === other)
          ? prev.map((th) =>
              th.id === other
                ? {
                    ...th,
                    lastMessage: {
                      content: t.noiDung,
                      timestamp: t.ngayTao,
                      isRead: false,
                    },
                  }
                : th
            )
          : [
              {
                id: other,
                user: { id: other, name: other, avatar: null },
                lastMessage: { content: t.noiDung, timestamp: t.ngayTao, isRead: false },
              },
              ...prev,
            ]
      );
    });

    return () => {
      hub.stop();
    };
  }, [me]);

  // ====== Tìm kiếm người dùng ======
  useEffect(() => {
    if (!searchQ.trim()) {
      setResults([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setBusy(true);
      const token = localStorage.getItem("token") || "";
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/NguoiDung?searchTerm=${encodeURIComponent(searchQ)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("Không thể tìm kiếm người dùng");
        const users: NguoiDung[] = await response.json();
        setResults(
          users.map((u) => ({
            id: u.maNguoiDung,
            name: u.hoTen,
            avatar: u.hinhAnh ? `data:image/png;base64,${u.hinhAnh}` : null,
          }))
        );
      } catch (error) {
        console.error("Lỗi khi tìm kiếm:", error);
      } finally {
        setBusy(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQ]);

  // ====== Chọn người dùng từ kết quả tìm kiếm ======
  const selectUser = (u: UserSearchResult) => {
    if (!threads.find((t) => t.id === u.id)) {
      setThreads((prev) => [
        {
          id: u.id,
          user: u,
          lastMessage: { content: "", timestamp: new Date().toISOString(), isRead: true },
        },
        ...prev,
      ]);
    }
    setSelected(u.id);
    setResults([]);
    setSearchQ("");
  };

  // ====== Giao diện khi đang tải ======
  if (loading) {
    return <div className="flex items-center justify-center h-full">Đang tải...</div>;
  }

  // ====== Giao diện chính ======
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-full">
      {/* Danh sách người dùng và tìm kiếm */}
      <Card className="lg:col-span-1 border border-[#9b87f5] rounded-xl shadow h-full bg-[#f5f0ff]">
        <CardHeader className="p-2 border-b border-[#9b87f5]/30">
          <CardTitle className="flex items-center gap-2 text-[#9b87f5]">
            <MessageSquare className="h-5 w-5" /> Tin nhắn
          </CardTitle>
          <CardDescription className="text-gray-600">
            Tìm hoặc chọn người để trò chuyện
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#9b87f5]" />
            <Input
              placeholder="Tìm người dùng..."
              className="pl-8 border-[#9b87f5] rounded-full focus:ring-[#9b87f5] bg-white"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
          {busy && <p className="text-[#9b87f5] text-sm">Đang tìm...</p>}
          {results.map((u) => (
            <div
              key={u.id}
              onClick={() => selectUser(u)}
              className="flex items-center p-2 cursor-pointer hover:bg-[#9b87f5]/10 rounded-xl border border-[#9b87f5]/50"
            >
              <Avatar className="h-8 w-8 mr-2">
                {u.avatar ? (
                  <AvatarImage src={u.avatar} />
                ) : defaultAvatar ? (
                  <AvatarImage src={defaultAvatar} />
                ) : (
                  <AvatarFallback>{u.name[0]}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-[#9b87f5]">{u.name}</span>
            </div>
          ))}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] space-y-1">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`flex items-center p-2 rounded-xl cursor-pointer ${
                  selected === t.id ? "bg-[#9b87f5]/20" : "hover:bg-[#9b87f5]/10"
                } border border-[#9b87f5]/50`}
              >
                <Avatar className="h-8 w-8 mr-2">
                  {t.user.avatar ? (
                    <AvatarImage src={t.user.avatar} />
                  ) : defaultAvatar ? (
                    <AvatarImage src={defaultAvatar} />
                  ) : (
                    <AvatarFallback>{t.user.name[0]}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-[#9b87f5]">{t.user.name}</p>
                  <p className="text-xs truncate text-gray-600">{t.lastMessage.content}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(t.lastMessage.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        {selected ? (
          <MessageThread
            threadId={selected}
            user={threads.find((t) => t.id === selected)!.user}
          />
        ) : (
          <Card className="h-full flex items-center justify-center flex-col border-[#9b87f5] rounded-xl bg-[#f5f0ff]">
            <MessageSquare className="text-[#9b87f5] text-4xl" />
            <p className="mt-2 text-[#9b87f5]">Chọn một cuộc trò chuyện để bắt đầu</p>
          </Card>
        )}
      </div>
    </div>
  );
};