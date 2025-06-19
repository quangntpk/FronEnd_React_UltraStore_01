import { useParams } from "react-router-dom";
import { BlogDetailComponent } from "@/components/blogs/BlogDetailComponent";

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>(); // Change 'id' to 'slug'

  return (
    <div className="py-6 sm:py-8 md:py-10">
      <BlogDetailComponent /> {/* Remove blogId prop */}
    </div>
  );
};

export default BlogDetail;