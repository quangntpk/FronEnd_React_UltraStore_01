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
import { MessageSquare, Search, Pin } from "lucide-react";
import { MessageThread } from "./MessageThread";

interface MessagesInboxProps {
  recipientId?: string;
  recipientName?: string;
}

interface NguoiDung {
  maNguoiDung: string;
  hoTen: string;
  hinhAnh: string | null;
}

interface Thread {
  id: string;
  user: { id: string; name: string; avatar: string | null };
  lastMessage: { content: string; timestamp: string; isRead: boolean };
  isPinned?: boolean;
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
  const [defaultAvatar, setDefaultAvatar] = useState<string | null>(null);

  const PINNED_USER_ID = "AD00012";
  const PINNED_USER_NAME = "Admin";

  const fetchDefaultAvatar = async () => {
    try {
      const response = await fetch(`${API_URL}/api/GiaoDien`,
        { headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
         } }
      );
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

  useEffect(() => {
    fetchDefaultAvatar();
  }, []);

  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      const token = localStorage.getItem("token") || "";
      try {
        const response = await fetch(
          `${API_URL}/api/TinNhan/threads?userId=${encodeURIComponent(me)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!response.ok) throw new Error("Không thể tải threads");
        const data: ThreadView[] = await response.json();

        const mapThreads = await Promise.all(
          data.map(async (t) => {
            const other = t.nguoiGuiId === me ? t.nguoiNhanId : t.nguoiGuiId;
            const userResponse = await fetch(
              `${API_URL}/api/NguoiDung?searchTerm=${encodeURIComponent(other)}`,
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
              isPinned: other === PINNED_USER_ID,
            } as Thread;
          })
        );

        const pinnedUserExists = mapThreads.some((t) => t.id === PINNED_USER_ID);
        if (!pinnedUserExists) {
          const pinnedUserResponse = await fetch(
            `${API_URL}/api/NguoiDung?searchTerm=${encodeURIComponent(PINNED_USER_ID)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const pinnedUsers: NguoiDung[] = pinnedUserResponse.ok ? await pinnedUserResponse.json() : [];
          const pinnedUser = pinnedUsers.find((x) => x.maNguoiDung === PINNED_USER_ID);

          mapThreads.unshift({
            id: PINNED_USER_ID,
            user: {
              id: PINNED_USER_ID,
              name: pinnedUser?.hoTen || PINNED_USER_NAME,
              avatar: pinnedUser?.hinhAnh ? `data:image/png;base64,${pinnedUser.hinhAnh}` : null,
            },
            lastMessage: {
              content: "",
              timestamp: new Date().toISOString(),
              isRead: true,
            },
            isPinned: true,
          });
        }

        setThreads(mapThreads.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0)));

        if (recipientId) {
          const existing = mapThreads.find((t) => t.id === recipientId);
          if (!existing && recipientName) {
            setThreads([
              {
                id: recipientId,
                user: { id: recipientId, name: recipientName, avatar: null },
                lastMessage: { content: "", timestamp: new Date().toISOString(), isRead: true },
                isPinned: recipientId === PINNED_USER_ID,
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
          `${API_URL}/api/NguoiDung?searchTerm=${encodeURIComponent(searchQ)}`,
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

  const selectUser = (u: UserSearchResult) => {
    if (!threads.find((t) => t.id === u.id)) {
      setThreads((prev) =>
        [
          {
            id: u.id,
            user: u,
            lastMessage: { content: "", timestamp: new Date().toISOString(), isRead: true },
            isPinned: u.id === PINNED_USER_ID,
          },
          ...prev,
        ].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
      );
    }
    setSelected(u.id);
    setResults([]);
    setSearchQ("");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Đang tải...</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-full">
      <Card className="lg:col-span-1 border border-[#c083fc] rounded-xl shadow h-full bg-[#f5f0ff]">
        <CardHeader className="p-2 border-b border-[#c083fc]/30">
          <CardTitle className="flex items-center gap-2 text-[#c083fc]">
            <MessageSquare className="h-5 w-5" /> Tin nhắn
          </CardTitle>
          <CardDescription className="text-gray-600">
            Tìm hoặc chọn người để trò chuyện
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-[#c083fc]" />
            <Input
              placeholder="Tìm người dùng..."
              className="pl-8 border-[#c083fc] rounded-full focus:ring-[#c083fc] bg-white"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
            />
          </div>
          {busy && <p className="text-[#c083fc] text-sm">Đang tìm...</p>}
          {results.map((u) => (
            <div
              key={u.id}
              onClick={() => selectUser(u)}
              className="flex items-center p-2 cursor-pointer hover:bg-[#c083fc]/10 rounded-xl border border-[#c083fc]/50"
            >
              <Avatar className="h-8 w-8 mr-2">
                {u.avatar ? (
                  <AvatarImage src={u.avatar} />
                ) : defaultAvatar ? (
                  <AvatarImage src={defaultAvatar} />
                ) : (
                  <AvatarFallback className="bg-[#00c2cb] text-white">{u.name[0]}</AvatarFallback>
                )}
              </Avatar>
              <span className="text-[#c083fc]">{u.name}</span>
            </div>
          ))}
          <div className="overflow-y-auto max-h-[calc(100vh-200px)] space-y-1">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`flex items-center p-2 rounded-xl cursor-pointer ${
                  selected === t.id ? "bg-[#c083fc]/20" : "hover:bg-[#c083fc]/10"
                } border border-[#c083fc]/50`}
              >
                <Avatar className="h-8 w-8 mr-2">
                  {t.user.avatar ? (
                    <AvatarImage src={t.user.avatar} />
                  ) : defaultAvatar ? (
                    <AvatarImage src={defaultAvatar} />
                  ) : (
                    <AvatarFallback className="bg-[#00c2cb] text-white">{t.user.name[0]}</AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-[#c083fc]">
                    {t.user.name} {t.isPinned && <Pin className="inline h-4 w-4 ml-1 text-[#c083fc]" />}
                  </p>
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
          <Card className="h-full flex items-center justify-center flex-col border-[#c083fc] rounded-xl bg-[#f5f0ff]">
            <MessageSquare className="text-[#c083fc] text-4xl" />
            <p className="mt-2 text-[#c083fc]">Chọn một cuộc trò chuyện để bắt đầu</p>
          </Card>
        )}
      </div>
    </div>
  );
};