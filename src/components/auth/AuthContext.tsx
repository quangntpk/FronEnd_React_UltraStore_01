import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface User {
  maNguoiDung: string;
  fullName: string;
  email: string;
  vaiTro: number;
  role: string; 
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  userName: string;
  setAuth: (token: string | null, user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<User | null>(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

const setAuth = (newToken: string | null, newUser: User | null) => {
  setToken(newToken);
  setUser(newUser);

  if (newToken) {
    localStorage.setItem("token", newToken);
  } else {
    localStorage.removeItem("token");
  }

  if (newUser) {
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("userId", newUser.maNguoiDung);
  } else {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
  }
};


  const logout = async () => {
    try {
      await axios.post(
        "http://localhost:5261/api/XacThuc/DangXuat",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error("Logout error:", error.response?.data?.message || error.message);
    }
    setAuth(null, null);
  };

  const isLoggedIn = !!token;
  const userName = user?.fullName || "";

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, userName, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};