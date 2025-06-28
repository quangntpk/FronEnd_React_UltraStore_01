import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

interface ProductHoverDetailProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string;
    colors: string[];
    sizes: string[];
    description?: string;
  };
}

const ProductHoverDetail = ({ product }: ProductHoverDetailProps) => {
  return (
    <div className="group relative">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={product.image}
          alt={product.name}
          className="w-14 h-14 rounded object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div>
          <h4 className="font-medium">
            <Link
              to={`/products/${product.id}`}
              className="hover:text-crocus-600 transition-colors"
            >
              {product.name}
            </Link>
          </h4>
          <p className="text-sm text-gray-600">{(product.price / 1000).toFixed(3)} VND</p>
        </div>
      </div>
      <div className="absolute z-10 hidden group-hover:block w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4 -mt-12 ml-20">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 rounded object-cover"
              />
              <div>
                <h4 className="font-semibold text-lg">{product.name}</h4>
                <p className="text-crocus-600 font-bold">{(product.price / 1000).toFixed(3)} VND</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              {product.description || "Không có mô tả chi tiết"}
            </p>
            <div className="space-y-2">
              {product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium">Màu sắc:</label>
                  <div className="flex gap-2 mt-1">
                    {product.colors.map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border border-gray-300"
                        style={{ backgroundColor: `#${color}` }}
                        title={`#${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium">Kích thước:</label>
                  <div className="flex gap-2 mt-1">
                    {product.sizes.map((size, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 rounded text-sm"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductHoverDetail;