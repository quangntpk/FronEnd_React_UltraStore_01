import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

interface AuthContextType {
  isLoggedIn: boolean;
  userName: string;
  setAuth: (token: string | null, user: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [user, setUser] = useState<any>(() => {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }

    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [token, user]);

  const setAuth = (newToken: string | null, newUser: any) => {
  setToken(newToken);
  setUser(newUser);

  if (newToken && newUser) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));

    localStorage.setItem("userId", newUser.maNguoiDung || newUser.userId || "");
  } else {
    localStorage.removeItem("token");
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
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    } catch (error) {
      console.error("Logout error:", error.response?.data?.message || error.message);
    }
    setAuth(null, null);
  };

  const isLoggedIn = !!token;
  const userName = user?.hoTen || user?.fullName || "";

  return (
    <AuthContext.Provider value={{ isLoggedIn, userName, setAuth, logout }}>
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
