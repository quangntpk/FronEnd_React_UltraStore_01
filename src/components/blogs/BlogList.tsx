import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Heart, MessageCircle } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  timestamp: Date;
  author: string;
  authorImage: string;
  category: string;
  likes: number;
  comments: number;
  relatedProducts?: number[];
  relatedCombos?: number[];
}

interface BlogListProps {
  posts: BlogPost[];
}

const BlogList: React.FC<BlogListProps> = ({ posts }) => {
  const [expandedStates, setExpandedStates] = useState<{ [key: string]: boolean }>({});
  const [likedStates, setLikedStates] = useState<{ [key: string]: boolean }>({});
  const contentLengthThreshold = 200;

  const handleToggleExpand = (postId: string) => {
    setExpandedStates(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleLike = (postId: string) => {
    setLikedStates(prev => {
      const isLiked = !prev[postId];
      toast({
        title: isLiked ? "Đã thích" : "Bỏ thích",
        description: isLiked ? "Bạn đã thích bài viết!" : "Bạn đã bỏ thích bài viết.",
      });
      return { ...prev, [postId]: isLiked };
    });
  };

  const handleComment = () => {
    toast({
      title: "Bình luận",
      description: "Chức năng bình luận đang được phát triển!",
    });
  };

  return (
    <div className="flex flex-col gap-6 items-center">
      {posts.map(post => {
        const isExpanded = !!expandedStates[post.id];
        const isLiked = !!likedStates[post.id];
        const needsReadMore = post.content.length > contentLengthThreshold;

        return (
          <Card
            key={post.id}
            className="w-[80vw] max-w-[850px] shadow-md hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-center space-x-3">
                <img
                  src={post.authorImage}
                  alt={post.author}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <h3 className="text-base font-semibold">{post.author}</h3>
                  <p className="text-sm text-gray-500">
                    {post.date} • {post.category}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <h2 className="text-xl font-bold">{post.title}</h2>
              {post.image && (
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-auto object-contain rounded-md"
                />
              )}
             <div
  className="text-gray-500 break-words whitespace-pre-wrap max-w-[90ch]"
  dangerouslySetInnerHTML={{
    __html: isExpanded || !needsReadMore
      ? post.content
      : `${post.content.slice(0, contentLengthThreshold)}...`,
  }}
/>
              {needsReadMore && (
                <Button
                  variant="link"
                  onClick={() => handleToggleExpand(post.id)}
                  className="p-0 text-blue-600 hover:underline"
                >
                  {isExpanded ? "Thu gọn" : "Xem thêm"}
                </Button>
              )}
            </CardContent>
            <CardFooter className="flex justify-between items-center border-t pt-3">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center space-x-1 ${isLiked ? "text-red-500" : "text-gray-500"}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500" : ""}`} />
                  <span>{post.likes + (isLiked ? 1 : 0)}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleComment}
                  className="flex items-center space-x-1 text-gray-500"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.comments}</span>
                </Button>
              </div>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default BlogList;
