
import { useParams } from "react-router-dom";
import { BlogDetailComponent } from "@/components/blogs/BlogDetailComponent";

const BlogDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="py-6 sm:py-8 md:py-10">
      <BlogDetailComponent blogId={id || ""} />
    </div>
  );
};

export default BlogDetail;
