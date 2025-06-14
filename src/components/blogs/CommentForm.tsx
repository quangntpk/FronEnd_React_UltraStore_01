
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CommentFormProps {
  blogId: string;
  replyTo?: string;
  onCommentAdded?: () => void;
  onCancelReply?: () => void;
}

export const CommentForm = ({ 
  blogId, 
  replyTo, 
  onCommentAdded,
  onCancelReply 
}: CommentFormProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // In a real app, this would be an API call
    setTimeout(() => {
      // Simulate API call
      setIsSubmitting(false);
      setName("");
      setEmail("");
      setComment("");
      
      toast({
        title: replyTo ? "Reply sent" : "Comment added",
        description: "Your comment has been successfully submitted.",
      });

      if (onCommentAdded) {
        onCommentAdded();
      }
    }, 1000);
  };

  return (
    <Card className="mb-8">
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarImage src="https://via.placeholder.com/40x40" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {replyTo ? `Reply to comment` : "Leave a comment"}
              </p>
              <p className="text-sm text-gray-500">
                Your email will not be published
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Textarea
                placeholder="Write your comment here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="min-h-[120px]"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
          {replyTo && (
            <Button 
              type="button" 
              variant="ghost"
              onClick={onCancelReply}
            >
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            className="bg-crocus-500 hover:bg-crocus-600" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : replyTo ? "Reply" : "Post Comment"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
