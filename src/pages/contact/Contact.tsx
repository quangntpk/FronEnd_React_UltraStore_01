import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  User,
  Send,
  RefreshCw,
} from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const API_URL = import.meta.env.VITE_API_URL;
const APP_TITLE = import.meta.env.VITE_TITLE;

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    captcha: "",
  });

  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const handleRecaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
    setErrors((prev) => ({ ...prev, captcha: "" }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: "", email: "", phone: "", message: "", captcha: "" };

    if (name.length < 5) {
      newErrors.name = "Tên phải có ít nhất 5 ký tự";
      isValid = false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      newErrors.email = "Email không hợp lệ";
      isValid = false;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone)) {
      newErrors.phone = "Số điện thoại phải là 10 chữ số";
      isValid = false;
    }

    if (message.length < 5) {
      newErrors.message = "Nội dung phải có ít nhất 5 ký tự";
      isValid = false;
    }

    if (!captchaToken) {
      newErrors.captcha = "Vui lòng xác minh reCAPTCHA";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      MySwal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Vui lòng kiểm tra lại các trường thông tin và xác minh reCAPTCHA!",
        confirmButtonText: "Đóng",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        HoTen: name,
        Email: email,
        Sdt: phone,
        NoiDung: message,
        TrangThai: "0",
        ReCaptchaToken: captchaToken,
      };

      const response = await fetch(`${API_URL}/api/LienHe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
      }

      setIsSubmitting(false);
      setIsSubmitted(true);
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setCaptchaToken(null);
      setErrors({ name: "", email: "", phone: "", message: "", captcha: "" });
      recaptchaRef.current?.reset();

      MySwal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Tin nhắn của bạn đã được gửi. Chúng tôi sẽ phản hồi sớm nhất có thể.",
        confirmButtonText: "OK",
      });
    } catch (error) {
      setIsSubmitting(false);
      MySwal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi xảy ra khi gửi tin nhắn. Vui lòng thử lại!",
        confirmButtonText: "Đóng",
      });
      console.error("Error submitting contact form:", error);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Liên hệ với {APP_TITLE}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Bạn có câu hỏi về sản phẩm hoặc cần hỗ trợ với đơn hàng của mình? Chúng tôi sẵn sàng
          giúp đỡ! Hãy liên hệ với chúng tôi qua các phương thức dưới đây.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <Card className="text-center">
          <CardHeader>
            <a
              href="tel:+84383777823"
              className="w-12 h-12 bg-crocus-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Phone className="h-6 w-6 text-crocus-600" />
            </a>
            <CardTitle>Gọi điện cho chúng tôi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Thứ Hai - Thứ Sáu, 9h sáng - 5h chiều</p>
            <a href="tel:+84383777823" className="font-medium text-lg mt-2">
              (84) 383-777-823
            </a>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <a
              href="mailto:nguyenhuythien9a1@gmail.com"
              className="w-12 h-12 bg-crocus-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Mail className="h-6 w-6 text-crocus-600" />
            </a>
            <CardTitle>Gửi email cho chúng tôi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Chúng tôi sẽ phản hồi trong vòng 24 giờ</p>
            <a href="mailto:nguyenhuythien9a1@gmail.com" className="font-medium text-lg mt-2">
              nguyenhuythien9a1@gmail.com
            </a>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <a
              href="https://www.google.com/maps/place/Tr%C6%B0%E1%BB%9Dng+Cao+%C4%91%E1%BA%B3ng+polytechnic/@12.7105609,108.075659,16z/data=!4m6!3m5!1s0x3171f7b6e379b675:0x72662967145555c0!8m2!3d12.7105609!4d108.075659!16s%2Fg%2F1ptzmn5bd?entry=ttu&g_ep=EgoyMDI0MTAyMy4wKgBIAVAD"
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-crocus-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <MapPin className="h-6 w-6 text-crocus-600" />
            </a>
            <CardTitle>Ghé thăm cửa hàng</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Cửa hàng chính của chúng tôi</p>
            <a
              href="https://www.google.com/maps/place/Tr%C6%B0%E1%BB%9Dng+Cao+%C4%91%E1%BA%B3ng+polytechnic/@12.7105609,108.075659,16z/data=!4m6!3m5!1s0x3171f7b6e379b675:0x72662967145555c0!8m2!3d12.7105609!4d108.075659!16s%2Fg%2F1ptzmn5bd?entry=ttu&g_ep=EgoyMDI0MTAyMy4wKgBIAVAD"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium mt-2"
            >
              123 Hà Huy Tập<br />TP Buôn Ma Thuột
            </a>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Gửi tin nhắn cho chúng tôi</CardTitle>
            <CardDescription>
              Điền vào form dưới đây và chúng tôi sẽ phản hồi sớm nhất có thể.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900">Tin nhắn đã được gửi!</h3>
                <p className="text-gray-600 mt-2">
                  Cảm ơn bạn đã liên hệ với chúng tôi. Chúng tôi sẽ phản hồi tin nhắn của bạn
                  trong thời gian sớm nhất.
                </p>
                <Button
                  onClick={() => setIsSubmitted(false)}
                  className="mt-4 bg-crocus-500 hover:bg-crocus-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Gửi tin nhắn khác
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên của bạn</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="name"
                      placeholder="Nhập họ tên"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className={`pl-10 ${errors.name ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Địa chỉ email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Nhập email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className={`pl-10 ${errors.email ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Nhập số điện thoại"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setPhone(value);
                      }}
                      maxLength={10}
                      required
                      className={`pl-10 ${errors.phone ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm">{errors.phone}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Tin nhắn của bạn</Label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-4 text-gray-500 h-4 w-4" />
                    <textarea
                      id="message"
                      placeholder="Nhập nội dung"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className={`w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10 ${
                        errors.message ? "border-red-500" : "border-input"
                      }`}
                      required
                    ></textarea>
                  </div>
                  {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
                </div>
                <div className="space-y-2">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey="6LdMzlEqAAAAAIRD7o-nvN9bH3jPvKLaKaGW8xD4"
                    onChange={handleRecaptchaChange}
                  />
                  {errors.captcha && <p className="text-red-500 text-sm">{errors.captcha}</p>}
                </div>
                <Button
                  type="submit"
                  className="w-full bg-crocus-500 hover:bg-crocus-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang gửi..." : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Gửi tin nhắn
                    </>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="h-192 rounded-lg overflow-hidden">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d12210.24681885916!2d108.075659!3d12.7105609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3171f7b6e379b675%3A0x72662967145555c0!2zVHJ1b25nIENhb8OqIGRhw7MgcG9seXRlY2huaWM!5e0!3m2!1svi!2s!4v1698473155913!5m2!1svi!2s"
            className="border-0 w-full h-full"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Kết nối với chúng tôi</h2>
        <p className="text-gray-600 max-w-xl mx-auto mb-6">
          Theo dõi chúng tôi trên mạng xã hội để nhận cập nhật mới nhất, mẹo thời trang và ưu đãi
          độc quyền.
        </p>
        <div className="flex justify-center space-x-6">
          <a
            href="https://www.facebook.com/FashionHub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-crocus-600 transition-colors"
          >
            <svg
              className="h-8 w-8"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <a
            href="https://www.instagram.com/FashionHub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-crocus-600 transition-colors"
          >
            <svg
              className="h-8 w-8"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.045-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                clipRule="evenodd"
              />
            </svg>
          </a>
          <a
            href="https://www.twitter.com/FashionHub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-crocus-600 transition-colors"
          >
            <svg
              className="h-8 w-8"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Contact;