import axios from "axios";
import { toast } from "@/components/ui/use-toast";

interface JwtPayload {
  maNguoiDung: string;
  fullName: string;
  email: string;
  role: string;
  [key: string]: any;
}

const api = axios.create({
  baseURL: "http://localhost:8080", 
});

axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        console.log("Token in interceptor:", token); 
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log("Authorization header set:", config.headers.Authorization); 
        } else {
            console.warn("No token found in localStorage");
        }
        return config;
    },
    (error) => {
        console.error("Interceptor request error:", error);
        return Promise.reject(error);
    }
);

axios.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API error:", error.response?.config.url, error.response?.status);
        if (error.response?.status === 401) {
            if (window.location.pathname !== "/auth/login") {
                toast({
                    title: "Phiên đăng nhập hết hạn!",
                    description: "Vui lòng đăng nhập lại.",
                    variant: "destructive",
                    duration: 3000,
                });
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                window.location.href = "/auth/login";
            }
        } 
        return Promise.reject(error);
    }
);