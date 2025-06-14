
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageSquare, Share } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

interface BlogHeaderProps {
  blog: {
    title: string;
    category: string;
    author: string;
    authorImage: string;
    date: string;
    likes: number;
    comments: number;
  };
  onLike: () => void;
  onShare: () => void;
  onCommentClick: () => void;
  liked: boolean;
}

export const BlogHeader = ({ 
  blog, 
  onLike, 
  onShare, 
  onCommentClick,
  liked 
}: BlogHeaderProps) => {
  const isMobile = useBreakpoint("mobile");

  return (
    <div className="mb-6">
      <Badge variant="outline" className="mb-2">
        {blog.category === "product" ? "Product Feature" : "Combo Suggestion"}
      </Badge>
      <h1 className={`${isMobile ? 'text-2xl' : 'text-3xl'} font-bold mb-2 leading-tight`}>{blog.title}</h1>
      
      <div className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'} mt-4`}>
        <div className="flex items-center space-x-3">
          <Avatar className={isMobile ? "h-8 w-8" : "h-10 w-10"}>
            <AvatarImage src={blog.authorImage} alt={blog.author} />
            <AvatarFallback>{blog.author.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div>
            <p className={`font-medium ${isMobile ? 'text-sm' : ''}`}>{blog.author}</p>
            <p className="text-sm text-gray-500">{blog.date}</p>
          </div>
        </div>

        <div className={`flex items-center ${isMobile ? 'justify-between w-full' : 'space-x-4'}`}>
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "default"} 
            className={`flex items-center ${liked ? 'text-red-500' : 'text-gray-500'}`}
            onClick={onLike}
          >
            <Heart className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-1 ${liked ? 'fill-current' : ''}`} />
            <span>{liked ? blog.likes + 1 : blog.likes}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "default"}
            className="flex items-center text-gray-500"
            onClick={onCommentClick}
          >
            <MessageSquare className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-1`} />
            <span>{blog.comments}</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size={isMobile ? "sm" : "default"}
            className="flex items-center text-gray-500"
            onClick={onShare}
          >
            <Share className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-1`} />
            <span className={isMobile ? "hidden" : ""}>Share</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
