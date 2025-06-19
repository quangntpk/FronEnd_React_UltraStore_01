
import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useState } from "react";
import { Image } from "lucide-react";
import { useBreakpoint } from "@/hooks/use-mobile";

interface BlogContentProps {
  image: string;
  title: string;
  content: string;
}

export const BlogContent = ({ image, title, content }: BlogContentProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const isMobile = useBreakpoint("mobile");
  const isTablet = useBreakpoint("tablet");

  // Select the appropriate aspect ratio based on device
  const getAspectRatio = () => {
    if (isMobile) return 4/3;
    if (isTablet) return 16/9;
    return 21/9; // Wider aspect ratio for desktop
  };

  return (
    <>
      <div className="relative rounded-lg overflow-hidden mb-6 sm:mb-8 shadow-md">
        <AspectRatio ratio={getAspectRatio()} className="bg-muted">
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <Image className="h-12 w-12 sm:h-16 sm:w-16 text-slate-400" />
              <span className="sr-only">Image failed to load</span>
            </div>
          ) : (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
                </div>
              )}
              <img 
                src={image} 
                alt={title} 
                className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                loading="lazy"
                fetchPriority="high"
              />
            </>
          )}
        </AspectRatio>
      </div>

      <Card className="mb-8">
        <CardContent className={`${isMobile ? 'px-4 py-4' : isTablet ? 'px-5 py-5' : 'pt-6'}`}>
          <div 
            className={`prose ${isMobile ? 'prose-sm' : isTablet ? 'prose-base' : 'prose-lg'} max-w-none`} 
            dangerouslySetInnerHTML={{ __html: content }} 
          />
        </CardContent>
      </Card>
    </>
  );
};
