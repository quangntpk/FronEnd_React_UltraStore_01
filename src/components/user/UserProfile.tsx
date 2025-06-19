import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Link, useNavigate } from "react-router-dom";
import { MessageSquare, Mail, User, MapPin, Calendar, Info, UserX, Asterisk, Phone, Shield, AlertTriangle, Edit } from "lucide-react";

interface UserProfileProps {
  userId: string;
  fullName: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  joinDate: string;
  birthDate?: string | null;
  phone?: string | null;
  cccd?: string | null;
  email?: string | null;
  address?: string | null;
  password?: string | null;
  role?: number | null;
  status?: number | null;
  createDate?: string | null;
  gender?: number | null;
  cancelCount?: number | null;
  isVerified?: boolean | null;
  lockoutEndDate?: string | null;
  isCurrentUser?: boolean;
  location?: string;
  website?: string;
  followers?: number;
  following?: number;
}

export const UserProfile = ({
  userId,
  fullName,
  username,
  avatarUrl,
  bio = "Chưa có thông tin",
  joinDate,
  birthDate,
  phone,
  cccd,
  email,
  address,
  password,
  role,
  status,
  createDate,
  gender,
  cancelCount,
  isVerified,
  lockoutEndDate,
  isCurrentUser = false,
  location,
  website,
  followers = 0,
  following = 0,
}: UserProfileProps) => {
  const navigate = useNavigate();

  const getGenderInfo = (gender: number | null) => {
    switch (gender) {
      case null:
        return { text: "Khác", icon: <Asterisk className="h-5 w-5 mr-3 text-[#9b87f5]" /> };
      case 1:
        return { text: "Nam", icon: <User className="h-5 w-5 mr-3 text-[#9b87f5]" /> };
      case 2:
        return { text: "Nữ", icon: <UserX className="h-5 w-5 mr-3 text-[#9b87f5]" /> };
      default:
        return { text: "Khác", icon: <Asterisk className="h-5 w-5 mr-3 text-[#9b87f5]" /> };
    }
  };

  const getRoleText = (role: number | null) => {
    switch (role) {
      case 0:
        return "Người dùng";
      case 1:
        return "Quản trị viên";
      default:
        return "Không xác định";
    }
  };

  const getStatusText = (status: number | null) => {
    switch (status) {
      case 0:
        return "Hoạt động";
      case 1:
        return "Không hoạt động";
      default:
        return "Không xác định";
    }
  };

  const handleMessageClick = () => {
    navigate("/user/messages", {
      state: {
        recipientId: userId,
        recipientName: fullName,
      },
    });
  };

  const genderInfo = getGenderInfo(gender);
  const roleText = getRoleText(role);
  const statusText = getStatusText(status);

  return (
    <div className="container mx-auto py-8 px-6">
      <Card className="max-w-4xl mx-auto shadow-lg rounded-xl border-2 border-[#9b87f5]/20">
        <CardHeader className="pb-6 border-b border-[#9b87f5]/30 bg-gradient-to-r from-[#9b87f5]/10 to-[#e6e1ff]/30 rounded-t-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-[#9b87f5]/30">
                {avatarUrl ? (
                  <AvatarImage src={avatarUrl} alt={fullName} />
                ) : (
                  <AvatarFallback className="bg-[#e6e1ff] text-[#9b87f5] text-2xl">
                    {fullName.split(" ").map((name) => name[0]).join("")}
                  </AvatarFallback>
                )}
              </Avatar>
              <div>
                <h2 className="text-3xl font-bold text-[#9b87f5]">{fullName}</h2>
                <p className="text-[#9b87f5]/80 text-lg">@{username}</p>
                <div className="flex items-center mt-2">
                  {genderInfo.icon}
                  <p className="text-[#9b87f5]/80 text-md">{genderInfo.text}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              {!isCurrentUser && (
                <Button
                  onClick={handleMessageClick}
                  className="bg-[#9b87f5] hover:bg-[#8a77e0] text-white flex items-center gap-3 rounded-lg px-6 py-3 text-lg"
                  aria-label={`Gửi tin nhắn đến ${fullName}`}
                >
                  <MessageSquare className="h-10 w-10" />
                  <span>Nhắn tin</span>
                </Button>
              )}
              {isCurrentUser && (
                <Button
                  asChild
                  className="bg-[#9b87f5] hover:bg-[#8a77e0] text-white flex items-center gap-3 rounded-lg px-6 py-3 text-lg"
                  aria-label={`Chỉnh sửa hồ sơ của ${fullName}`}
                >
                  <Link to="/user/edit-profile">
                    <Edit className="h-5 w-5" />
                    <span>Chỉnh sửa</span>
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-6 text-[#9b87f5]">Thông tin cá nhân</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label htmlFor="bio" className="font-medium text-gray-700 mb-2 flex items-center text-lg">
                      <Info className="h-5 w-5 mr-3 text-[#9b87f5]" />
                      Giới thiệu
                    </label>
                    <input
                      id="bio"
                      type="text"
                      value={bio}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#9b87f5]/30 rounded-lg bg-[#9b87f5]/5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] text-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="font-medium text-gray-700 mb-2 flex items-center text-lg">
                      <Phone className="h-5 w-5 mr-3 text-[#9b87f5]" />
                      Số điện thoại
                    </label>
                    <input
                      id="phone"
                      type="text"
                      value={phone || "Không có số điện thoại"}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#9b87f5]/30 rounded-lg bg-[#9b87f5]/5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] text-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="birthDate" className="font-medium text-gray-700 mb-2 flex items-center text-lg">
                      <Calendar className="h-5 w-5 mr-3 text-[#9b87f5]" />
                      Ngày sinh
                    </label>
                    <input
                      id="birthDate"
                      type="text"
                      value={birthDate || "Không có ngày sinh"}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#9b87f5]/30 rounded-lg bg-[#9b87f5]/5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] text-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="role" className="font-medium text-gray-700 mb-2 flex items-center text-lg">
                      <Shield className="h-5 w-5 mr-3 text-[#9b87f5]" />
                      Vai trò
                    </label>
                    <input
                      id="role"
                      type="text"
                      value={roleText}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#9b87f5]/30 rounded-lg bg-[#9b87f5]/5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] text-lg"
                    />
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="address" className="font-medium text-gray-700 mb-2 flex items-center text-lg">
                      <MapPin className="h-5 w-5 mr-3 text-[#9b87f5]" />
                      Địa chỉ
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={address || "Không có địa chỉ"}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#9b87f5]/30 rounded-lg bg-[#9b87f5]/5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] text-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="font-medium text-gray-700 mb-2 flex items-center text-lg">
                      <Mail className="h-5 w-5 mr-3 text-[#9b87f5]" />
                      Email
                    </label>
                    <input
                      id="email"
                      type="text"
                      value={email || "Không có email"}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#9b87f5]/30 rounded-lg bg-[#9b87f5]/5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] text-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="joinDate" className="font-medium text-gray-700 mb-2 flex items-center text-lg">
                      <Calendar className="h-5 w-5 mr-3 text-[#9b87f5]" />
                      Ngày tạo
                    </label>
                    <input
                      id="joinDate"
                      type="text"
                      value={joinDate}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#9b87f5]/30 rounded-lg bg-[#9b87f5]/5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] text-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="font-medium text-gray-700 mb-2 flex items-center text-lg">
                      <AlertTriangle className="h-5 w-5 mr-3 text-[#9b87f5]" />
                      Trạng thái
                    </label>
                    <input
                      id="status"
                      type="text"
                      value={statusText}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-[#9b87f5]/30 rounded-lg bg-[#9b87f5]/5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#9b87f5] text-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};