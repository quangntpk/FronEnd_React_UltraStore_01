
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentForm } from "./CommentForm";

// Mock comments data
const commentsData: {
  [key: string]: Array<{
    id: string;
    name: string;
    date: string;
    content: string;
    avatar: string;
    likes: number;
    replies?: Array<{
      id: string;
      name: string;
      date: string;
      content: string;
      avatar: string;
      likes: number;
    }>;
  }>;
} = {
  "1": [
    {
      id: "c1",
      name: "Alex Thompson",
      date: "April 17, 2025",
      content: "I love the new summer collection! The Crocus Cotton Tee is definitely on my wishlist. Do you plan to add more colors to the collection?",
      avatar: "https://via.placeholder.com/40x40",
      likes: 5,
      replies: [
        {
          id: "r1c1",
          name: "Emma Johnson",
          date: "April 17, 2025",
          content: "Thank you for your interest! Yes, we're planning to release more colors in the coming weeks. Stay tuned!",
          avatar: "https://via.placeholder.com/40x40",
          likes: 2
        }
      ]
    },
    {
      id: "c2",
      name: "Jamie Lee",
      date: "April 16, 2025",
      content: "The sustainable aspect of this collection is impressive. I appreciate brands that prioritize eco-friendly practices!",
      avatar: "https://via.placeholder.com/40x40",
      likes: 8
    }
  ],
  "2": [
    {
      id: "c1",
      name: "Riley Parker",
      date: "April 12, 2025",
      content: "I've been struggling to incorporate purple into my wardrobe, but these tips are really helpful! Will definitely try the color blocking suggestion.",
      avatar: "https://via.placeholder.com/40x40",
      likes: 4
    }
  ],
  "3": [
    {
      id: "c1",
      name: "Morgan Smith",
      date: "April 7, 2025",
      content: "I purchased the Weekend Wanderer combo last week and have already created so many different outfits! Best investment ever.",
      avatar: "https://via.placeholder.com/40x40",
      likes: 12,
      replies: [
        {
          id: "r1c1",
          name: "Sophia Rodriguez",
          date: "April 8, 2025",
          content: "That's wonderful to hear! The Weekend Wanderer is one of our most versatile combos. Would love to see how you've styled it!",
          avatar: "https://via.placeholder.com/40x40",
          likes: 3
        }
      ]
    },
    {
      id: "c2",
      name: "Taylor Williams",
      date: "April 6, 2025",
      content: "Can you suggest combos that work well for business casual environments? I need versatile pieces that can transition from office to evening events.",
      avatar: "https://via.placeholder.com/40x40",
      likes: 7
    }
  ],
  "4": [
    {
      id: "c1",
      name: "Jordan Reed",
      date: "March 30, 2025",
      content: "It's refreshing to see a fashion brand taking sustainability seriously. The Tencel dress sounds amazing - is it available in plus sizes?",
      avatar: "https://via.placeholder.com/40x40",
      likes: 6
    }
  ],
  "5": [
    {
      id: "c1",
      name: "Casey Kim",
      date: "March 22, 2025",
      content: "The Essential Capsule combo has completely transformed my wardrobe! I no longer stress about what to wear every morning. Thank you!",
      avatar: "https://via.placeholder.com/40x40",
      likes: 15
    }
  ]
};

interface CommentListProps {
  blogId: string;
}

export const CommentList = ({ blogId }: CommentListProps) => {
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  
  const comments = commentsData[blogId] || [];

  const handleLikeComment = (commentId: string) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  if (comments.length === 0) {
    return <p className="text-center py-4 text-gray-500">No comments yet. Be the first to comment!</p>;
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <Card key={comment.id} className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarImage src={comment.avatar} />
                <AvatarFallback>{comment.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <h4 className="font-medium">{comment.name}</h4>
                    <p className="text-sm text-gray-500">{comment.date}</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{comment.content}</p>
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={likedComments.has(comment.id) ? "text-crocus-600" : "text-gray-500"}
                    onClick={() => handleLikeComment(comment.id)}
                  >
                    {likedComments.has(comment.id) ? 
                      `Liked (${comment.likes + 1})` : 
                      `Like (${comment.likes})`
                    }
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-gray-500"
                    onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  >
                    Reply
                  </Button>
                </div>
                
                {replyingTo === comment.id && (
                  <div className="mt-4">
                    <CommentForm 
                      blogId={blogId} 
                      replyTo={comment.id} 
                      onCommentAdded={() => setReplyingTo(null)} 
                      onCancelReply={() => setReplyingTo(null)}
                    />
                  </div>
                )}
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-6 ml-6 space-y-4">
                    {comment.replies.map((reply) => (
                      <div key={reply.id} className="border-l-2 pl-4 border-gray-200">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={reply.avatar} />
                            <AvatarFallback>{reply.name.substring(0, 2)}</AvatarFallback>
                          </Avatar>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h5 className="font-medium">{reply.name}</h5>
                              <span className="text-sm text-gray-500">{reply.date}</span>
                            </div>
                            
                            <p className="text-gray-700 mb-2">{reply.content}</p>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className={likedComments.has(reply.id) ? "text-crocus-600" : "text-gray-500"}
                              onClick={() => handleLikeComment(reply.id)}
                            >
                              {likedComments.has(reply.id) ? 
                                `Liked (${reply.likes + 1})` : 
                                `Like (${reply.likes})`
                              }
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
