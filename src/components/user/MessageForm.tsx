import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, Heart, X } from "lucide-react";

const emojiList = ["😊", "😂", "❤️", "👍", "😍", "😢", "😡", "🎉", "🔥", "💯"];

const messageSchema = z.object({
  message: z.string().max(1000, "Tin nhắn không được vượt quá 1000 ký tự"),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface MessageFormProps {
  recipientId: string;
  recipientName: string;
  initialMessage?: string;
  onSuccess?: (message: string, file?: File) => void;
}

interface ApiResponse {
  tepDinhKemUrl?: string;
}

export const MessageForm: React.FC<MessageFormProps> = ({
  recipientId,
  recipientName,
  initialMessage = "",
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: initialMessage },
  });

  useEffect(() => {
    const savedState = localStorage.getItem(`messageForm_${recipientId}`);
    if (savedState) {
      const { selectedFileData, previewUrlData } = JSON.parse(savedState);
      if (selectedFileData) setSelectedFile(new File([], selectedFileData.name, { type: selectedFileData.type }));
      if (previewUrlData) setPreviewUrl(previewUrlData);
    }
  }, [recipientId]);

  useEffect(() => {
    if (selectedFile || previewUrl) {
      localStorage.setItem(`messageForm_${recipientId}`, JSON.stringify({
        selectedFileData: selectedFile ? { name: selectedFile.name, type: selectedFile.type } : null,
        previewUrlData: previewUrl,
      }));
    } else {
      localStorage.removeItem(`messageForm_${recipientId}`);
    }
  }, [selectedFile, previewUrl, recipientId]);

  const sendMessage = async (
    content: string,
    isEmoji = false,
    file?: File
  ) => {
    setIsSubmitting(true);
    setShowEmojiPicker(false);

    try {
      const token = localStorage.getItem("token");
      const senderId = localStorage.getItem("userId");

      if (!token || !senderId) {
        throw new Error("Vui lòng đăng nhập để gửi tin nhắn.");
      }

      if (file && file.size > 10 * 1024 * 1024) {
        throw new Error("Dung lượng tệp không được vượt quá 10MB.");
      }

      const formData = new FormData();
      formData.append("NguoiGuiId", senderId);
      formData.append("NguoiNhanId", recipientId);
      formData.append("NoiDung", content);
      if (isEmoji) formData.append("KieuTinNhan", "emoji");
      if (file) formData.append("TepTin", file);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/TinNhan/gui`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Gửi tin nhắn thất bại");
      }

      const responseData: ApiResponse = await res.json();
      form.reset();
      setSelectedFile(null);
      setPreviewUrl(null);
      onSuccess?.(content, file);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gửi thất bại";
      form.setError("message", { type: "manual", message: msg });
      console.error("Lỗi gửi tin nhắn:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        form.setError("message", { type: "manual", message: "Dung lượng tệp không được vượt quá 10MB." });
        return;
      }
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.handleSubmit((values) => sendMessage(values.message, false, selectedFile))();
    }
  };

  const handleEmojiSend = (emoji: string) => sendMessage(emoji, true);

  const handleHeartSend = () => sendMessage("❤️", true);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => sendMessage(values.message, false, selectedFile))}>
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              {(selectedFile || previewUrl) && (
                <div className="relative mb-2">
                  {previewUrl && selectedFile?.type.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-[150px] rounded-md"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">
                      Tệp đã chọn: {selectedFile?.name}
                    </p>
                  )}
                  <Button
                    type="button"
                    onClick={handleRemoveFile}
                    className="absolute top-1 right-1 p-1 rounded-full bg-gray-500/80 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {showEmojiPicker && (
                <div className="flex flex-wrap gap-2 p-2 mb-2 border rounded-md bg-white border-[#c083fc]">
                  {emojiList.map((emoji) => (
                    <Button
                      key={emoji}
                      type="button"
                      className="text-2xl bg-transparent hover:bg-[#c083fc]/10"
                      onClick={() => handleEmojiSend(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-[#f5f0ff] text-[#c083fc] rounded-full hover:bg-[#c083fc]/20"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => setShowEmojiPicker((prev) => !prev)}
                    className="p-2 bg-[#f5f0ff] text-[#c083fc] rounded-full hover:bg-[#c083fc]/20"
                  >
                    <Smile className="w-5 h-5" />
                  </Button>
                </div>

                <FormControl className="flex-1">
                  <Textarea
                    {...field}
                    placeholder={`Nhập tin nhắn đến ${recipientName}...`}
                    className="min-h-[40px] max-h-[120px] h-[40px] resize-none overflow-y-auto border-2 border-[#c083fc] bg-[#f5f0ff] focus:ring-[#c083fc] rounded-full px-4 py-2 text-sm"
                    onChange={field.onChange}
                    onKeyDown={handleKeyDown}
                  />
                </FormControl>

                {form.watch("message")?.trim() ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="p-2 rounded-full text-white bg-[#c083fc] hover:bg-[#b072e8]"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleHeartSend}
                    className="p-2 rounded-full text-[#00c2cb] bg-[#f5f0ff] hover:bg-[#00c2cb]/20"
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                )}
              </div>

              <FormMessage className="text-xs text-red-600 mt-1" />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
};