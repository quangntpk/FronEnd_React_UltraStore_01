import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useToast } from "@/components/ui/use-toast";
import {ToastContainer} from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import { ArrowLeft, Eye, EyeOff, Mail, Key, RefreshCw, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

// Định nghĩa schema xác thực
const emailSchema = z.object({
  email: z.string().email('Email không hợp lệ').nonempty('Email không được để trống'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'Mã OTP phải có đúng 6 ký tự').nonempty('Mã OTP không được để trống'),
});

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().nonempty('Xác nhận mật khẩu không được để trống'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });


type EmailFormData = z.infer<typeof emailSchema>;
type OtpFormData = z.infer<typeof otpSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type ForgotPasswordStep = 'email' | 'otp' | 'newPassword';

interface ApiResponse {
  message: string;
}

export const ForgotPasswordForm: React.FC = () => {
  const [step, setStep] = useState<ForgotPasswordStep>('email');
  const [email, setEmail] = useState<string>('');
  const [otp, setOtp] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:5261/api/XacThuc';

  // Khởi tạo form
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const resetPasswordForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Xử lý gửi OTP
  const handleSendOtp = async (data: EmailFormData) => {
    setLoading(true);
    try {
      const response = await axios.post<ApiResponse>(`${API_BASE_URL}/forgot-password`, {
        email: data.email,
      });
      toast.success(response.data.message || 'Mã OTP đã được gửi đến email của bạn!');
      setEmail(data.email);
      setCooldown(60);
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi mã OTP, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý xác minh OTP
  const handleVerifyOtp = async (data: OtpFormData) => {
    setLoading(true);
    try {
      const response = await axios.post<ApiResponse>(`${API_BASE_URL}/verify-otp`, {
        email,
        otp: data.otp,
      });
      toast.success(response.data.message || 'Mã OTP hợp lệ!');
      setOtp(data.otp);
      setStep('newPassword');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý đặt lại mật khẩu
  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setLoading(true);
    try {
      const response = await axios.post<ApiResponse>(`${API_BASE_URL}/reset-password`, {
        email,
        otp,
        newPassword: data.newPassword,
      });
      toast.success(response.data.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý gửi lại OTP
  const handleResendOtp = async () => {
    if(cooldown > 0) {
      toast.info(`Vui lòng đợi ${cooldown} giây để gửi mã OTP`);
    }
    setLoading(true);
    try {
      const response = await axios.post<ApiResponse>(`${API_BASE_URL}/forgot-password`, { email });
      toast.success(response.data.message || 'Mã OTP mới đã được gửi!');
      setCooldown(60);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể gửi lại OTP, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {step === 'email' && 'Quên mật khẩu'}
            {step === 'otp' && 'Nhập mã xác nhận'}
            {step === 'newPassword' && 'Đặt mật khẩu mới'}
          </CardTitle>
          <CardDescription className="text-center">
            {step === 'email' && 'Nhập email của bạn để nhận mã OTP'}
            {step === 'otp' && 'Nhập mã xác nhận đã gửi đến email của bạn'}
            {step === 'newPassword' && 'Tạo mật khẩu mới an toàn'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' && (
            <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Nhập email"
                    {...emailForm.register('email')}
                    className="pl-10"
                  />
                  {emailForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {emailForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Gửi OTP
              </Button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Mã xác nhận</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="otp"
                    placeholder="Nhập mã OTP"
                    {...otpForm.register('otp')}
                    maxLength={6}
                    className="pl-10 text-center text-lg tracking-widest"
                  />
                  {otpForm.formState.errors.otp && (
                    <p className="mt-1 text-sm text-red-600">
                      {otpForm.formState.errors.otp.message}
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                )}
                Xác nhận mã
              </Button>
              <div className="text-center mt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center mx-auto"
                  disabled={loading}
                >
                  <RefreshCw className="mr-1 h-3 w-3" /> 
                  {cooldown > 0 ? `Gửi lại OTP(${cooldown}s)` : 'Gửi lại OTP'}
                </button>
              </div>
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="mr-1 h-3 w-3" /> Quay lại email
                </button>
              </div>
            </form>
          )}

          {step === 'newPassword' && (
            <form onSubmit={resetPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu mới"
                    {...resetPasswordForm.register('newPassword')}
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {resetPasswordForm.formState.errors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {resetPasswordForm.formState.errors.newPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Xác nhận mật khẩu mới"
                    {...resetPasswordForm.register('confirmPassword')}
                    className="pl-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {resetPasswordForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">
                      {resetPasswordForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Lock className="mr-2 h-4 w-4" />
                )}
                Đặt lại mật khẩu
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <div className="text-center text-sm">
            Nhớ mật khẩu của bạn?{' '}
            <Link to="/auth/login" className="font-medium text-blue-600 hover:text-blue-700">
              Đăng nhập
            </Link>
          </div>
        </CardFooter>
      </Card>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
    </div>
  );
};