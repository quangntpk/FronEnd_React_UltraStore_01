import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Phone, Users, Target, Eye } from "lucide-react";

const About = () => {
  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center">Về chúng tôi</CardTitle>
          <CardDescription className="text-center">Tìm hiểu thêm về sứ mệnh, tầm nhìn và đội ngũ của chúng tôi.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-crocus-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-crocus-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Sứ mệnh</h3>
              <p className="text-gray-600">Mang đến những sản phẩm thời trang chất lượng cao với giá cả hợp lý.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-crocus-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-6 w-6 text-crocus-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Tầm nhìn</h3>
              <p className="text-gray-600">Trở thành thương hiệu thời trang hàng đầu tại Việt Nam.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-crocus-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-crocus-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">Đội ngũ</h3>
              <p className="text-gray-600">Đội ngũ chuyên nghiệp với nhiều năm kinh nghiệm trong ngành thời trang.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;