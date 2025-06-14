
import { useState, useMemo, useEffect, useRef } from "react";
import BlogList from "@/components/blogs/BlogList";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Định nghĩa giao diện BlogPost
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

// Hàm định dạng ngày giờ
const formatDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return "Ngày không xác định";
  }
};

interface FilteredBlogListProps {
  blogPosts: BlogPost[];
  activeTab: string;
  searchTerm: string;
  author: string;
  sortBy: string;
  postsToShow: number;
}

const FilteredBlogList = ({
  blogPosts,
  activeTab,
  searchTerm,
  author,
  sortBy,
  postsToShow,
}: FilteredBlogListProps) => {
  const filteredPosts = useMemo(() => {
    let posts = blogPosts;

    // Lọc theo danh mục
    if (activeTab !== "all") {
      posts = posts.filter(post => post.category === activeTab);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm) {
      posts = posts.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Lọc theo tác giả
    if (author && author !== "all") {
      posts = posts.filter(post => post.author === author);
    }

    // Sắp xếp bài viết
    switch (sortBy) {
      case "newest":
        return [...posts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      case "oldest":
        return [...posts].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      case "title_asc":
        return [...posts].sort((a, b) => a.title.localeCompare(b.title));
      case "title_desc":
        return [...posts].sort((a, b) => b.title.localeCompare(b.title));
      case "popular":
        return [...posts].sort((a, b) => b.likes - a.likes);
      case "comments":
        return [...posts].sort((a, b) => b.comments - a.comments);
      default:
        return posts;
    }
  }, [blogPosts, activeTab, searchTerm, author, sortBy]);

  const displayedPosts = filteredPosts.slice(0, postsToShow);

  return (
    <>
      {displayedPosts.length === 0 ? (
        <div className="text-center py-6 sm:py-12 border rounded-md bg-gray-50">
          <h3 className="text-lg sm:text-xl font-semibold mb-2">Không tìm thấy bài viết</h3>
          <p className="text-gray-600 mb-4 px-4">Hãy thử điều chỉnh tìm kiếm hoặc bộ lọc</p>
        </div>
      ) : (
        <BlogList posts={displayedPosts} />
      )}
    </>
  );
};

const BlogsList = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [postsToShow, setPostsToShow] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const isMobile = useIsMobile();
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Lấy dữ liệu từ API
  const fetchBlogs = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`http://localhost:5261/api/Blog`);
      if (!response.ok) throw new Error("Không thể lấy dữ liệu blog");
      const data = await response.json();

      // Ánh xạ dữ liệu từ API sang BlogPost
      const mappedBlogs: BlogPost[] = data.map((blog: any) => ({
        id: blog.maBlog.toString(),
        title: blog.tieuDe || "Không có tiêu đề",
        excerpt: blog.noiDung?.length > 100 ? blog.noiDung.substring(0, 100) + "..." : blog.noiDung || "",
        content: blog.noiDung?.includes("<") ? blog.noiDung : `<p>${blog.noiDung?.replace(/\n/g, "<br>") || "Không có nội dung"}</p>`,
        image: blog.hinhAnh ? `data:image/jpeg;base64,${blog.hinhAnh}` : "https://via.placeholder.com/800x500",
        date: formatDateTime(blog.ngayTao || new Date().toISOString()),
        timestamp: new Date(blog.ngayTao || new Date()),
        author: blog.hoTen || blog.maNguoiDung || "Tác giả không xác định",
        authorImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.hoTen || blog.maNguoiDung || "Unknown")}`,
        category: blog.category || "product",
        likes: blog.likes || Math.floor(Math.random() * 200),
        comments: blog.comments || Math.floor(Math.random() * 50),
        relatedProducts: blog.relatedProducts || [1, 2],
        relatedCombos: blog.relatedCombos || [1, 2],
      }));

      console.log("Mapped blogs:", mappedBlogs);
      setBlogs(mappedBlogs);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách blog:", error);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra khi tải danh sách blog.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Lấy danh sách tác giả duy nhất
  const authors = useMemo(() => 
    [...new Set(blogs.map(post => post.author))],
    [blogs]
  );

  // Thông báo về cuộn vô hạn
  useEffect(() => {
    toast({
      title: "Khám phá Blog Thời Trang",
      description: "Lướt xuống để xem thêm bài viết, giống như trên mạng xã hội!",
      duration: 5000,
    });
  }, []);

  // Logic cuộn vô hạn
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && postsToShow < blogs.length) {
          setIsLoading(true);
          setTimeout(() => {
            setPostsToShow(prev => prev + 5);
            setIsLoading(false);
          }, 1000);
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [isLoading, postsToShow, blogs.length]);

  const resetFilters = () => {
    setActiveTab("all");
    setSearchTerm("");
    setSelectedAuthor("all");
    setSortBy("newest");
    setPostsToShow(5);
    toast({
      title: "Đặt lại bộ lọc",
      description: "Tất cả bộ lọc đã được đặt lại về giá trị mặc định.",
    });
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 container mx-auto max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Blog Thời Trang</h1>
      
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col space-y-4 mb-6 sticky top-0 bg-white z-10 py-4 shadow-sm">
          <TabsList className="w-full max-w-full overflow-x-auto flex-wrap justify-center h-auto p-1">
            <TabsTrigger value="all" className={`${isMobile ? 'text-sm py-1.5' : ''}`}>Tất cả bài viết</TabsTrigger>
            <TabsTrigger value="product" className={`${isMobile ? 'text-sm py-1.5' : ''}`}>Tính năng sản phẩm</TabsTrigger>
            <TabsTrigger value="combo" className={`${isMobile ? 'text-sm py-1.5' : ''}`}>Gợi ý phối đồ</TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </span>
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'}`}>
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="title_asc">Tiêu đề (A-Z)</SelectItem>
                <SelectItem value="title_desc">Tiêu đề (Z-A)</SelectItem>
                <SelectItem value="popular">Phổ biến nhất</SelectItem>
                <SelectItem value="comments">Nhiều bình luận nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedAuthor} onValueChange={setSelectedAuthor}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'}`}>
                <SelectValue placeholder="Lọc theo tác giả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tác giả</SelectItem>
                {authors.map(author => (
                  <SelectItem key={author} value={author}>{author}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              onClick={resetFilters}
              className="w-full sm:w-auto"
              size={isMobile ? "sm" : "default"}
            >
              Đặt lại bộ lọc
            </Button>
          </div>
        </div>
        
        <TabsContent value={activeTab} className="mt-0">
          <FilteredBlogList 
            blogPosts={blogs}
            activeTab={activeTab}
            searchTerm={searchTerm}
            author={selectedAuthor}
            sortBy={sortBy}
            postsToShow={postsToShow}
          />
        </TabsContent>
      </Tabs>

      {isLoading && (
        <div className="text-center py-6">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Đang tải thêm bài viết...</p>
        </div>
      )}

      {postsToShow < blogs.length && (
        <div ref={loadMoreRef} className="h-10" />
      )}

      {postsToShow >= blogs.length && blogs.length > 0 && (
        <div className="text-center py-6">
          <p className="text-gray-600">Bạn đã xem hết bài viết! Hãy quay lại để xem thêm nội dung mới.</p>
        </div>
      )}

      <div className="text-sm text-gray-500 text-center mt-4">
        {blogs.length} bài viết được tìm thấy
      </div>
    </div>
  );
};

export default BlogsList;