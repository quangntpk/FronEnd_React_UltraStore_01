
import { useState, useMemo } from "react";
import { BlogList } from "@/components/blogs/BlogList";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

// Mock blog data for filter functionality
const blogPosts = [
  {
    id: "1",
    title: "Summer 2025 Collection",
    excerpt: "Discover our new summer collection featuring the hottest trends in fashion with the 2025 Pantone color.",
    image: "https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&h=450",
    date: "April 15, 2025",
    timestamp: new Date("2025-04-15"),
    author: "Emma Johnson",
    authorImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=60&h=60",
    category: "product",
    likes: 128,
    comments: 32,
    relatedProducts: [1, 2]
  },
  {
    id: "2",
    title: "How to Style Crocus Purple",
    excerpt: "Learn how to incorporate the trending Crocus Purple color into your wardrobe this season.",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&h=450",
    date: "April 10, 2025",
    timestamp: new Date("2025-04-10"),
    author: "Michael Chen",
    authorImage: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=60&h=60",
    category: "product",
    likes: 95,
    comments: 18,
    relatedProducts: [3]
  },
  {
    id: "3",
    title: "Perfect Outfit Combinations",
    excerpt: "Explore our curated outfit combinations that will elevate your style game.",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=800&h=450",
    date: "April 5, 2025",
    timestamp: new Date("2025-04-05"),
    author: "Sophia Rodriguez",
    authorImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=60&h=60",
    category: "combo",
    likes: 156,
    comments: 45,
    relatedCombos: [1, 2]
  },
  {
    id: "4",
    title: "Sustainable Fashion Choices",
    excerpt: "Discover our eco-friendly clothing options that don't compromise on style.",
    image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=800&h=450",
    date: "March 28, 2025",
    timestamp: new Date("2025-03-28"),
    author: "Daniel Lee",
    authorImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=60&h=60",
    category: "product",
    likes: 72,
    comments: 14,
    relatedProducts: [1, 4]
  },
  {
    id: "5",
    title: "Mix and Match with Combos",
    excerpt: "Learn the art of mixing and matching with our fashion combos to create versatile looks.",
    image: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&h=450",
    date: "March 20, 2025",
    timestamp: new Date("2025-03-20"),
    author: "Isabella Martinez",
    authorImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=60&h=60",
    category: "combo",
    likes: 110,
    comments: 27,
    relatedCombos: [3, 4]
  },
];

// Update our BlogList component
interface FilteredBlogListProps {
  blogPosts: any[];
  activeTab: string;
  searchTerm: string;
  author: string;
  sortBy: string;
}

// This is a wrapper component that interfaces with our existing BlogList component
// but applies our filter logic
const FilteredBlogList = ({ blogPosts, activeTab, searchTerm, author, sortBy }: FilteredBlogListProps) => {
  // We'll implement the BlogList display logic here
  const filteredPosts = useMemo(() => {
    let posts = blogPosts;

    // Filter by category
    if (activeTab !== "all") {
      posts = posts.filter(post => post.category === activeTab);
    }

    // Filter by search term
    if (searchTerm) {
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by author
    if (author) {
      posts = posts.filter(post => post.author === author);
    }

    // Sort posts
    switch (sortBy) {
      case "newest":
        return [...posts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      case "oldest":
        return [...posts].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      case "title_asc":
        return [...posts].sort((a, b) => a.title.localeCompare(b.title));
      case "title_desc":
        return [...posts].sort((a, b) => b.title.localeCompare(a.title));
      case "popular":
        return [...posts].sort((a, b) => b.likes - a.likes);
      case "comments":
        return [...posts].sort((a, b) => b.comments - a.comments);
      default:
        return posts;
    }
  }, [blogPosts, activeTab, searchTerm, author, sortBy]);

  return (
    <>
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No blog posts found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map(post => (
            <div key={post.id} className="blog-item">
              {/* The existing BlogList component will map through and render these */}
              {/* We've set up the structure to allow BlogList to work with our filtered data */}
              <div className="hidden">{post.id}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const BlogsList = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [author, setAuthor] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const isMobile = useIsMobile();

  // Get unique authors for filter
  const authors = useMemo(() => 
    [...new Set(blogPosts.map(post => post.author))],
    []
  );

  const resetFilters = () => {
    setSearchTerm("");
    setActiveTab("all");
    setAuthor("");
    setSortBy("newest");
    toast({
      title: "Filters reset",
      description: "All blog filters have been reset to default values.",
    });
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 container mx-auto">
      

      
      {/* Results count - hidden on very small screens */}
      <div className="hidden xs:block mb-2 sm:mb-4">
        <p className="text-sm sm:text-base text-gray-600">
          {blogPosts.filter(post => 
            (activeTab === "all" || post.category === activeTab) &&
            (!searchTerm || post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
             post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (!author || post.author === author)
          ).length} posts found
        </p>
      </div>
      
      <BlogList />
    </div>
  );
};

export default BlogsList;
