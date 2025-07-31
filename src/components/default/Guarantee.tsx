import React from "react";

const Guarantee = () => {
  return (
    <section className="py-16 px-6 max-w-6xl mx-auto text-gray-900 text-lg leading-relaxed">
      <h2 className="text-4xl font-bold text-crocus-600 mb-8 text-center">Chính sách Đổi hàng & Bảo hành</h2>
      <p className="mb-6">
        Nhằm mang lại các dịch vụ hậu mãi tốt hơn cho khách hàng mua sắm tại hệ thống <strong>FashionHub</strong>, từ ngày <strong>01/09/2024</strong>, FashionHub có chính sách đổi trả & bảo hành áp dụng như sau:
      </p>

      {/* Điều 1 */}
      <h3 className="text-3xl font-semibold text-crocus-600 mt-10 mb-4">Điều 1: Chính sách đổi hàng</h3>
      <ul className="list-disc list-inside mb-6">
        <li>Sản phẩm đổi trả trong thời hạn 15 ngày kể từ ngày mua trên hóa đơn (với khách mua tại store), 15 ngày kể từ ngày nhận hàng (với khách mua online).</li>
        <li>Sản phẩm đổi còn nguyên tem, tags, hóa đơn mua hàng, không bị dính bẩn, hư hỏng bởi tác nhân bên ngoài cửa hàng sau khi mua.</li>
      </ul>

      <p className="font-semibold mb-2">Có thể đổi sang đơn hàng bất kỳ</p>
      <ul className="list-disc list-inside mb-6">
        <li>Đơn hàng đổi có giá trị thấp hơn: FashionHub không hoàn phần chênh lệch.</li>
        <li>Đơn hàng đổi có giá trị cao hơn: khách hàng thanh toán phần chênh lệch.</li>
        <li>Đơn hàng trong CTKM: vui lòng đổi trong thời gian CTKM để được giá ưu đãi. Nếu đổi sau sẽ tính theo giá hiện tại.</li>
        <li>Không áp dụng đổi với các sản phẩm sale trên 30%, vớ, boxer.</li>
      </ul>

      {/* Điều 2 */}
      <h3 className="text-3xl font-semibold text-crocus-600 mt-10 mb-4">Điều 2: Chính sách đổi do lỗi kỹ thuật và hoàn tiền</h3>
      <p className="font-semibold mb-2">Điều kiện áp dụng:</p>
      <ul className="list-disc list-inside mb-6">
        <li>Lỗi kỹ thuật: ố màu, phai màu, chất liệu, kiểu dáng, bung keo,...</li>
        <li>Không giống mô tả hoặc không giống hình.</li>
      </ul>
      <p className="mb-4">
        <strong>Lưu ý:</strong> Sản phẩm sẽ được đổi mới hoàn toàn miễn phí trong vòng 15 ngày kể từ ngày mua. (Sản phẩm chưa qua sử dụng).
      </p>
      <p className="mb-6 font-semibold">Trường hợp không được giải quyết:</p>
      <ul className="list-disc list-inside mb-6">
        <li>Sản phẩm đã qua sử dụng.</li>
      </ul>

      {/* Điều 3 */}
      <h3 className="text-3xl font-semibold text-crocus-600 mt-10 mb-4">Điều 3: Chính sách bảo hành</h3>
      <p className="mb-4">Các trường hợp và thời gian bảo hành:</p>
      <table className="w-full text-left border mb-6 text-base">
        <thead>
          <tr className="bg-gray-200 text-crocus-600 font-semibold">
            <th className="border px-4 py-2">Tên Sản Phẩm</th>
            <th className="border px-4 py-2">Điều Kiện Bảo Hành</th>
            <th className="border px-4 py-2">Thời Gian</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border px-4 py-2">Quần, Áo, Nón</td>
            <td className="border px-4 py-2">Đường chỉ, dây kéo, khuy...</td>
            <td className="border px-4 py-2">30 ngày</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Mắt kính</td>
            <td className="border px-4 py-2">Gãy lò xo, ve mũi, lỗi ốc vít, rơi mối hàn & nước xi</td>
            <td className="border px-4 py-2">30 ngày</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Thắt lưng</td>
            <td className="border px-4 py-2">Dây lưng bong tróc, nổ da tự nhiên</td>
            <td className="border px-4 py-2">30 ngày</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Balo, Túi xách, Ví</td>
            <td className="border px-4 py-2">Keo, Khóa, Dây kéo, Đường chỉ</td>
            <td className="border px-4 py-2">30 ngày</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">Giày, Dép</td>
            <td className="border px-4 py-2">Keo</td>
            <td className="border px-4 py-2">Trọn đời</td>
          </tr>
          <tr>
            <td className="border px-4 py-2">TechUrban Jeans (Smart, ICON105, ProCool)</td>
            <td className="border px-4 py-2">Nút, khoá kéo</td>
            <td className="border px-4 py-2">Trọn đời</td>
          </tr>
        </tbody>
      </table>

      <p className="mb-4 font-semibold">Chính sách bảo hành giày - dép:</p>
      <ul className="list-disc list-inside mb-6">
        <li>Trong 15 ngày kể từ lúc nhận hàng: nếu lỗi sẽ được đổi mới sản phẩm.</li>
        <li>Hỗ trợ bảo hành keo trọn đời.</li>
      </ul>

      <p className="mb-4 font-semibold text-yellow-600">Trường hợp không được bảo hành:</p>
      <ul className="list-disc list-inside mb-6">
        <li>Giặt không đúng cách.</li>
        <li>Ảnh hưởng bởi hóa chất làm thay đổi màu, form, hình dáng.</li>
        <li>Rách, cháy, trầy xước, biến dạng do nhiệt độ, ẩm mốc, côn trùng,...</li>
        <li>Sản phẩm vớ, boxer, khuyên tai, móc khóa, vòng tay, áo mưa, đồ lót,...</li>
        <li>Lỗi do tai nạn, thiên tai,...</li>
      </ul>

      {/* Điều 4 */}
      <h3 className="text-3xl font-semibold text-crocus-600 mt-10 mb-4">Điều 4: Chi phí đổi hàng</h3>
      <ul className="list-disc list-inside mb-6">
        <li>Miễn phí đổi hàng với lỗi do nhà sản xuất hoặc lỗi do vận chuyển.</li>
        <li>Nếu đổi vì lý do cá nhân (sai size, không hợp màu...), phí ship 1 chiều 20.000đ/đơn.</li>
        <li>FashionHub chỉ gửi sản phẩm mới sau khi nhận lại sản phẩm cũ.</li>
      </ul>

      <p className="italic text-center mt-6 text-sm">
        ***Trong mọi trường hợp, quyết định của FashionHub là quyết định cuối cùng. Xin cảm ơn và hân hạnh được phục vụ quý khách.
      </p>
    </section>
  );
};

export default Guarantee;
