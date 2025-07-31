import React from "react";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { MessagesInbox } from "@/components/user/MessagesInbox";
import { useLocation } from "react-router-dom";

const AdminMessages = () => {
  const location = useLocation();
  const { recipientId, recipientName } = location.state || {};

  const adminId = "AD00012";
  localStorage.setItem("userId", adminId);

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col">
      <MessagesInbox recipientId={recipientId} recipientName={recipientName} />
    </div>
  );
};

export default AdminMessages;