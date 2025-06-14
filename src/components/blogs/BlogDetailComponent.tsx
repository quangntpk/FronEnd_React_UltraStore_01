import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import { CommentForm } from "./CommentForm";
import { CommentList } from "./CommentList";
import { BlogHeader } from "./BlogHeader";
import { BlogContent } from "./BlogContent";
import { RelatedItemsSection } from "./RelatedItemsSection";
import { useBreakpoint } from "@/hooks/use-mobile";

// Mock blog data
const blogPosts = [
  {
    id: "1",
    title: "Summer 2025 Collection",
    content: `<p>Our Summer 2025 Collection draws inspiration from nature's vibrant palette, featuring the 2025 Pantone color of the year - Crocus Purple. This season is all about expressing individuality while embracing comfort and sustainability.</p>
              <p>The collection includes lightweight fabrics perfect for warm weather, including organic cotton, linen blends, and recycled polyester. The color palette revolves around the star color Crocus Purple, complemented by neutral tones and occasional pops of contrasting shades.</p>
              <h3>Key Pieces in the Collection:</h3>
              <ul>
                <li>Crocus Cotton Tees - The essential summer staple with a modern twist</li>
                <li>Linen Blend Shirts - Effortlessly elegant for both casual and semi-formal occasions</li>
                <li>Flowy Summer Dresses - Perfect for beach outings or city explorations</li>
              </ul>
              <p>Each piece in this collection has been thoughtfully designed to be versatile and timeless, reducing the need for constant wardrobe refreshes and promoting mindful consumption.</p>`,
    image: "https://via.placeholder.com/800x500",
    date: "April 15, 2025",
    author: "Emma Johnson",
    authorImage: "https://via.placeholder.com/40x40",
    category: "product",
    likes: 128,
    comments: 32,
    relatedProducts: [1, 2]
  },
  {
    id: "2",
    title: "How to Style Crocus Purple",
    content: `<p>Crocus Purple, the 2025 Pantone color of the year, brings a fresh and vibrant energy to any wardrobe. This versatile shade can be incorporated into your style in numerous ways, from bold statement pieces to subtle accents.</p>
              <h3>Styling Tips for Crocus Purple:</h3>
              <p><strong>Monochromatic Look:</strong> Embrace the purple trend by going all in with a monochromatic outfit. Pair different shades and textures of purple for a sophisticated and trendy look.</p>
              <p><strong>Color Blocking:</strong> Crocus Purple pairs beautifully with complementary colors like yellow-green or contrasting colors like mustard yellow. Try color blocking for a bold fashion statement.</p>
              <p><strong>Accessories:</strong> If you're hesitant to fully commit to the purple trend, start with accessories. A Crocus Purple scarf, bag, or shoes can add the perfect pop of color to neutral outfits.</p>
              <p><strong>Casual Integration:</strong> Add a Crocus Purple t-shirt to your jeans and sneakers outfit for an instant style upgrade.</p>
              <p>Remember, fashion is about self-expression and having fun. Don't be afraid to experiment with this beautiful color and make it your own!</p>`,
    image: "https://via.placeholder.com/800x500",
    date: "April 10, 2025",
    author: "Michael Chen",
    authorImage: "https://via.placeholder.com/40x40",
    category: "product",
    likes: 95,
    comments: 18,
    relatedProducts: [3]
  },
  {
    id: "3",
    title: "Perfect Outfit Combinations",
    content: `<p>Creating the perfect outfit doesn't have to be a daily struggle. With our curated fashion combos, you can effortlessly put together stylish looks for any occasion.</p>
              <h3>Our Top Combos for Spring-Summer 2025:</h3>
              <p><strong>Casual Daytime Look:</strong> Our Crocus Cotton Tee paired with high-waisted linen shorts and white sneakers makes for a comfortable yet stylish everyday outfit.</p>
              <p><strong>Office-Ready Ensemble:</strong> The Linen Blend Shirt tucked into tailored trousers with minimal accessories creates a professional look that doesn't compromise on style or comfort.</p>
              <p><strong>Evening Elegance:</strong> Transform your daytime look by swapping the Cotton Tee for our Silk Camisole, adding statement earrings, and finishing with strappy heels.</p>
              <p><strong>Weekend Getaway:</strong> Our matching set featuring the Crocus Purple overshirt and relaxed-fit pants offers versatility and style for your weekend adventures.</p>
              <p>Each combo has been thoughtfully designed to maximize the versatility of individual pieces while creating cohesive looks that reflect current trends and timeless style.</p>`,
    image: "https://via.placeholder.com/800x500",
    date: "April 5, 2025",
    author: "Sophia Rodriguez",
    authorImage: "https://via.placeholder.com/40x40",
    category: "combo",
    likes: 156,
    comments: 45,
    relatedCombos: [1, 2]
  },
  {
    id: "4",
    title: "Sustainable Fashion Choices",
    content: `<p>At Fashion Hub, we believe that style and sustainability can go hand in hand. Our eco-friendly collection demonstrates our commitment to reducing the fashion industry's environmental impact without compromising on design or quality.</p>
              <h3>Our Sustainable Practices:</h3>
              <p><strong>Ethical Sourcing:</strong> We carefully select suppliers who uphold fair labor practices and environmentally responsible production methods.</p>
              <p><strong>Eco-Friendly Materials:</strong> Our sustainable collection features organic cotton, recycled polyester, and innovative fabrics made from natural or reclaimed materials.</p>
              <p><strong>Reduced Waste:</strong> Through thoughtful design and production processes, we minimize textile waste and repurpose leftover materials.</p>
              <h3>Key Pieces from Our Sustainable Collection:</h3>
              <p><strong>Organic Cotton Crocus Tee:</strong> Made from 100% GOTS-certified organic cotton, this tee is dyed using low-impact dyes that reduce water pollution.</p>
              <p><strong>Recycled Denim Jacket:</strong> Crafted from post-consumer denim and upcycled materials, each jacket saves approximately 1,800 gallons of water compared to producing new denim.</p>
              <p><strong>Tencel™ Lyocell Dress:</strong> This flowy summer dress is made from Tencel™ Lyocell, a sustainable fiber produced from responsibly harvested wood using a closed-loop process.</p>
              <p>By choosing pieces from our sustainable collection, you're not just enhancing your wardrobe—you're also contributing to a more sustainable fashion industry.</p>`,
    image: "https://via.placeholder.com/800x500",
    date: "March 28, 2025",
    author: "Daniel Lee",
    authorImage: "https://via.placeholder.com/40x40",
    category: "product",
    likes: 72,
    comments: 14,
    relatedProducts: [1, 4]
  },
  {
    id: "5",
    title: "Mix and Match with Combos",
    content: `<p>The art of mixing and matching is key to building a versatile wardrobe. Our fashion combos are designed to help you create multiple outfits from a limited number of pieces, promoting both style and sustainability.</p>
              <h3>Benefits of Fashion Combos:</h3>
              <p><strong>Versatility:</strong> Each piece in our combos is selected to work well with the others, allowing for numerous outfit possibilities.</p>
              <p><strong>Value:</strong> Investing in well-coordinated pieces offers better value than random shopping, as you'll get more outfits per item.</p>
              <p><strong>Simplified Dressing:</strong> With pre-coordinated items, decision fatigue becomes a thing of the past.</p>
              <h3>Our Favorite Combo Sets:</h3>
              <p><strong>The Essential Capsule:</strong> This combo includes a Crocus Purple blouse, neutral trousers, a versatile blazer, and basic tees that can be mixed to create over 10 different outfits.</p>
              <p><strong>Weekend Wanderer:</strong> Perfect for casual days, this combo features comfortable jeans, layerable tops, and a statement jacket that work together seamlessly.</p>
              <p><strong>Work-to-Weekend:</strong> This sophisticated combo transitions smoothly from office hours to evening outings with a mix of professional and casual pieces in coordinating colors.</p>
              <p>Remember, the key to successful mix-and-match styling is selecting pieces with complementary colors, consistent aesthetics, and varying silhouettes that work well together.</p>`,
    image: "https://via.placeholder.com/800x500",
    date: "March 20, 2025",
    author: "Isabella Martinez",
    authorImage: "https://via.placeholder.com/40x40",
    category: "combo",
    likes: 110,
    comments: 27,
    relatedCombos: [3, 4]
  },
];

interface BlogDetailComponentProps {
  blogId: string;
}

export const BlogDetailComponent = ({ blogId }: BlogDetailComponentProps) => {
  const [blog, setBlog] = useState<any | null>(null);
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();
  const isMobile = useBreakpoint("mobile");
  const isTablet = useBreakpoint("tablet");

  useEffect(() => {
    // In a real app, this would be an API call
    const foundBlog = blogPosts.find(post => post.id === blogId);
    if (foundBlog) {
      setBlog(foundBlog);
    }
  }, [blogId]);

  if (!blog) {
    return (
      <div className="text-center py-12">
        <p>Blog post not found</p>
        <Button variant="link" onClick={() => navigate('/blogs')}>
          Return to Blog List
        </Button>
      </div>
    );
  }

  const handleLike = () => {
    setLiked(!liked);
    // In a real app, this would update the likes count on the server
  };

  const handleShare = () => {
    // In a real app, this would open a share dialog
    alert('Share functionality would open sharing options here');
  };

  const scrollToComments = () => {
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={`mx-auto px-4 ${isMobile ? 'max-w-full' : isTablet ? 'max-w-2xl' : 'max-w-4xl'}`}>
      <Button 
        variant="ghost" 
        size={isMobile ? "sm" : "default"} 
        className="mb-4" 
        onClick={() => navigate('/blogs')}
      >
        <ChevronLeft className="h-4 w-4 mr-2" />
        Back to Blogs
      </Button>

      <BlogHeader 
        blog={blog}
        onLike={handleLike}
        onShare={handleShare}
        onCommentClick={scrollToComments}
        liked={liked}
      />

      <BlogContent 
        image={blog.image}
        title={blog.title}
        content={blog.content}
      />

      <RelatedItemsSection 
        category={blog.category}
        relatedProducts={blog.relatedProducts}
        relatedCombos={blog.relatedCombos}
      />

      <Separator className="my-6 sm:my-8" />
      
      <div id="comments-section" className="scroll-mt-16">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Comments ({blog.comments})</h2>
        <CommentForm blogId={blogId} />
        <CommentList blogId={blogId} />
      </div>
    </div>
  );
};
