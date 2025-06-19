import React from "react";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { MessagesInbox } from "@/components/user/MessagesInbox";
import { useLocation } from "react-router-dom";

const Messages = () => {
  const location = useLocation();
  const { recipientId, recipientName } = location.state || {};

  return (
    <div className="w-full h-[calc(100vh-64px)] flex flex-col">
      <MessagesInbox recipientId={recipientId} recipientName={recipientName} />
    </div>
  );
};

export default Messages;