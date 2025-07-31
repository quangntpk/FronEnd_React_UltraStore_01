import {
  LayoutDashboard, Users, Package, ShoppingCart,
  BarChart, FileText, Archive, Settings,
  HelpCircle, CreditCard, Megaphone, MessageSquare,
  Calendar, Globe, Shield, Heart, ClipboardList, Newspaper, MessageCircle,
  TruckIcon as Truck, TagIcon as Tag, LayersIcon as Layers,
  LayoutGrid
} from "lucide-react";

interface SidebarItemType {
  title: string;
  icon: React.ElementType;
  path: string;
  color: string;
  badge?: string;
}

export const adminItems: SidebarItemType[] = [
  { title: "Thống kê", icon: BarChart, path: "/admin/statistics", color: "text-blue-600" },
  { title: "Đơn hàng", icon: ShoppingCart, path: "/admin/orders", color: "text-orange-600" },
   { title: "Mua offline", icon: CreditCard, path: "/buy", color: "text-red-600" },
  { title: "Sản phẩm", icon: Package, path: "/admin/products", color: "text-green-600" },
  { title: "Combo", icon: Layers, path: "/admin/combos", color: "text-teal-600" },
  { title: "Thương hiệu", icon: Tag, path: "/admin/thuonghieu", color: "text-indigo-600" },
  { title: "Loại sản phẩm", icon: LayoutGrid, path: "/admin/loaisanpham", color: "text-teal-600" },
  { title: "HashTag", icon: Globe, path: "/admin/hashtag", color: "text-teal-600" },
  { title: "Tài khoản", icon: Users, path: "/admin/users", color: "text-red-600" },
  { title: "Bình luận", icon: MessageCircle, path: "/admin/inventory", color: "text-cyan-600" },
  { title: "Voucher", icon: Tag, path: "/admin/invoices", color: "text-gray-600" },
  { title: "Blog", icon: Newspaper, path: "/admin/blog", color: "text-blue-600" },
  { title: "Hỗ trợ", icon: MessageSquare, path: "/admin/messages", color: "text-blue-600" },
  { title: "Liên hệ", icon: HelpCircle, path: "/admin/contact", color: "text-blue-600" },
  { title: "Cài đặt", icon: Settings, path: "/admin/settings", color: "text-gray-600" }

];

export const staffItems: SidebarItemType[] = [
  // { title: "Bảng điều khiển", icon: LayoutDashboard, path: "/staff", color: "text-blue-600" },
  // { title: "Sản phẩm", icon: Package, path: "/staff/products", color: "text-green-600" },
  // { title: "Đơn hàng", icon: ShoppingCart, path: "/staff/orders", badge: "3", color: "text-orange-600" },
  // { title: "Kho hàng", icon: Archive, path: "/staff/inventory", color: "text-purple-600" },
  // { title: "Đơn đặt hàng", icon: ClipboardList, path: "/staff/purchase-orders", color: "text-teal-600" },
  // { title: "Vận chuyển", icon: Truck, path: "/staff/shipping", color: "text-indigo-600" },
  // { title: "Danh mục", icon: Tag, path: "/staff/categories", color: "text-pink-600" },
];

export const adminManagementItems: SidebarItemType[] = [
  // { title: "Thanh toán", icon: CreditCard, path: "/admin/payments", color: "text-yellow-600" },
  // { title: "Tiếp thị", icon: Megaphone, path: "/admin/marketing", color: "text-pink-600" },
  // { title: "Blog", icon: MessageSquare, path: "/admin/blog", color: "text-blue-600" },
  // { title: "Trò chuyện", icon: MessageSquare, path: "/admin/chat", color: "text-teal-600" },
  // { title: "Lịch", icon: Calendar, path: "/admin/calendar", color: "text-green-600" },
  // { title: "Báo cáo", icon: BarChart, path: "/admin/reports", color: "text-cyan-600" },
];

export const supportItems: SidebarItemType[] = [
  // { title: "Cài đặt", icon: Settings, path: "/admin/settings", color: "text-gray-600" },
  // { title: "Liên hệ", icon: HelpCircle, path: "/admin/contact", color: "text-blue-600" },
  // { title: "Yêu thích", icon: Heart, path: "/admin/favorites", color: "text-red-600" },
  // { title: "Trang web", icon: Globe, path: "/admin/website", color: "text-green-600" },
  // { title: "Bảo mật", icon: Shield, path: "/admin/security", color: "text-purple-600" },
];