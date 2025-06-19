import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { UserProfile } from "@/components/user/UserProfile";
import Swal from "sweetalert2";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5261";

interface NguoiDungView {
  maNguoiDung: string | null;
  hoTen: string | null;
  ngaySinh: string | null;
  sdt: string | null;
  cccd: string | null;
  email: string | null;
  taiKhoan: string | null;
  diaChi: string | null;
  matKhau: string | null;
  vaiTro: number | null;
  trangThai: number | null;
  hinhAnh: string | null;
  ngayTao: string | null;
  moTa: string | null;
  gioiTinh: number | null;
  cancelConunt: number | null;
  isveryfied: boolean | null;
  lockoutEndDate: string | null;
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

const ViewProfile = () => {
  const { userId = "" } = useParams<{ userId: string }>();
  const [userData, setUserData] = useState<NguoiDungView | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultAvatar, setDefaultAvatar] = useState<string | null>(null);
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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Bạn cần đăng nhập để xem thông tin người dùng.");
        }

        const response = await fetch(`${API_URL}/api/NguoiDung/${userId || "current"}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Không thể tải thông tin người dùng: ${errorText}`);
        }

        const data: NguoiDungView = await response.json();
        setUserData(data);
        setLoading(false);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Lỗi khi tải thông tin người dùng.";
        setError(errorMessage);
        setLoading(false);
        Swal.fire({
          icon: "error",
          title: "Lỗi",
          text: errorMessage,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    };

    fetchDefaultAvatar();
    fetchUserData();
  }, [userId]);

  if (loading) {
    return (
      <div className="py-6 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600" aria-label="Đang tải thông tin người dùng">
          Đang tải thông tin người dùng...
        </p>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="py-6 bg-gray-50/50 min-h-screen flex items-center justify-center">
        <p className="text-gray-600" aria-label="Không thể tải thông tin người dùng">
          Không thể tải thông tin người dùng.
        </p>
      </div>
    );
  }

  const isCurrentUser = userId === "current" || !userId;

  const formattedUserData = {
    userId: userData.maNguoiDung || "",
    fullName: userData.hoTen || "Không có tên",
    username: userData.taiKhoan || "",
    avatarUrl: userData.hinhAnh
      ? `data:image/png;base64,${userData.hinhAnh}`
      : defaultAvatar || "https://gockienthuc.edu.vn/wp-content/uploads/2024/07/hinh-anh-avatar-trang-mac-dinh-doc-dao-khong-lao-nhao_6690f0076072b.webp", // Sử dụng defaultAvatar làm fallback
    bio: userData.moTa || "Chưa có mô tả.",
    joinDate: userData.ngayTao
      ? new Date(userData.ngayTao).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "Không có ngày tham gia",
    birthDate: userData.ngaySinh
      ? new Date(userData.ngaySinh).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "Không có ngày sinh",
    phone: userData.sdt || "Không có số điện thoại",
    cccd: userData.cccd || "Không có CCCD",
    email: userData.email || "Không có email",
    address: userData.diaChi || "Không có địa chỉ",
    password: userData.matKhau || "Không có mật khẩu",
    role: userData.vaiTro,
    status: userData.trangThai,
    createDate: userData.ngayTao
      ? new Date(userData.ngayTao).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "Không có ngày tạo",
    gender: userData.gioiTinh,
    cancelCount: userData.cancelConunt || 0,
    isVerified: userData.isveryfied || false,
    lockoutEndDate: userData.lockoutEndDate
      ? new Date(userData.lockoutEndDate).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        })
      : "Không bị khóa",
    location: userData.diaChi || "Không có địa chỉ",
    website: "",
    followers: 0,
    following: 0,
  };

  return (
    <div className="py-6 bg-gray-50/50 min-h-screen">
      <UserProfile
        userId={formattedUserData.userId}
        fullName={formattedUserData.fullName}
        username={formattedUserData.username}
        avatarUrl={formattedUserData.avatarUrl}
        bio={formattedUserData.bio}
        joinDate={formattedUserData.joinDate}
        birthDate={formattedUserData.birthDate}
        phone={formattedUserData.phone}
        cccd={formattedUserData.cccd}
        email={formattedUserData.email}
        address={formattedUserData.address}
        password={formattedUserData.password}
        role={formattedUserData.role}
        status={formattedUserData.status}
        createDate={formattedUserData.createDate}
        gender={formattedUserData.gender}
        cancelCount={formattedUserData.cancelCount}
        isVerified={formattedUserData.isVerified}
        lockoutEndDate={formattedUserData.lockoutEndDate}
        isCurrentUser={isCurrentUser}
        location={formattedUserData.location}
        website={formattedUserData.website}
        followers={formattedUserData.followers}
        following={formattedUserData.following}
      />
    </div>
  );
};

export default ViewProfile;