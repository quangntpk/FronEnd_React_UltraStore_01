using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using UltraStrore.Data;
using System.Security.Claims;

namespace UltraStrore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrdersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetOrders()
        {
            try
            {
                Console.WriteLine("[DEBUG] Starting GetOrders request");

                // Load all products and supports data once
                var allSanPhams = await _context.SanPhams
                    .Include(sp => sp.HinhAnhs)
                    .AsNoTracking()
                    .ToListAsync();

                var allSupports = await _context.DonHangSupports
                    .AsNoTracking()
                    .ToListAsync();

                Console.WriteLine($"[DEBUG] Loaded {allSanPhams.Count} products and {allSupports.Count} supports");

                var orders = await _context.DonHangs
                    .Include(d => d.MaNguoiDungNavigation)
                    .Include(d => d.MaNhanVienNavigation)
                    .Include(d => d.ChiTietDonHangs)
                        .ThenInclude(cd => cd.MaSanPhamNavigation)
                        .ThenInclude(sp => sp.HinhAnhs)
                    .Include(d => d.ChiTietDonHangs)
                        .ThenInclude(cd => cd.MaComboNavigation)
                        .ThenInclude(c => c.ChiTietComBos)
                        .ThenInclude(ct => ct.MaSanPhamNavigation)
                        .ThenInclude(sp => sp.HinhAnhs)
                    .AsNoTracking()
                    .OrderByDescending(d => d.NgayDat)
                    .ToListAsync();

                Console.WriteLine($"[DEBUG] Loaded {orders.Count} orders");

                var result = orders.Select(d => new
                {
                    MaDonHang = d.MaDonHang,
                    TenNguoiNhan = d.TenNguoiNhan,
                    NgayDat = d.NgayDat?.ToString("dd/MM/yyyy") ?? "",
                    TrangThaiDonHang = (int)d.TrangThaiDonHang,
                    TrangThaiThanhToan = (int)d.TrangThaiHang,
                    HinhThucThanhToan = d.TrangThaiHang == TrangThaiThanhToan.ThanhToanKhiNhanHang ? "COD" : "VNPay",
                    LyDoHuy = d.LyDoHuy,
                    TongTien = d.ChiTietDonHangs.Sum(cd => cd.ThanhTien ?? 0),
                    FinalAmount = d.FinalAmount,
                    DiscountAmount = d.DiscountAmount,
                    ShippingFee = d.ShippingFee,

                    TenSanPhamHoacCombo = d.ChiTietDonHangs.Select(cd => cd.MaCombo != null
                        ? (cd.MaComboNavigation?.TenComBo ?? "Combo không tồn tại")
                        : (cd.MaSanPhamNavigation?.TenSanPham ?? "Sản phẩm không tồn tại"))
                        .FirstOrDefault(),

                    MaNhanVien = d.MaNhanVien,
                    HoTenNhanVien = d.MaNhanVienNavigation?.HoTen,
                    MaNguoiDung = d.MaNguoiDung,
                    HoTenKhachHang = d.MaNguoiDungNavigation?.HoTen,

                    // ✅ FIXED: Chi tiết sản phẩm với logic đúng
                    ChiTietSanPhams = d.ChiTietDonHangs.Select(cd =>
                    {
                        Console.WriteLine($"[DEBUG] Processing order {d.MaDonHang}, detail {cd.MaCtdh}, combo: {cd.MaCombo != null}");

                        return new
                        {
                            MaChiTietDh = cd.MaCtdh,
                            LaCombo = cd.MaCombo != null,
                            TenSanPham = cd.MaCombo != null
                                ? (cd.MaComboNavigation?.TenComBo ?? "Combo không tồn tại")
                                : (cd.MaSanPhamNavigation?.TenSanPham ?? "Sản phẩm không tồn tại"),
                            SoLuong = cd.SoLuong,
                            Gia = cd.Gia,
                            ThanhTien = cd.ThanhTien,
                            MaCombo = cd.MaCombo,
                            MaSanPham = cd.MaSanPham,

                            // Parse color/size for single products only
                            MauSac = cd.MaCombo == null ? ExtractColorFromProductCode(cd.MaSanPham) : null,
                            KichThuoc = cd.MaCombo == null ? ExtractSizeFromProductCode(cd.MaSanPham) : null,

                            // Image for combo or single product
                            HinhAnh = cd.MaCombo != null
                                ? GetComboImage(cd.MaComboNavigation, allSanPhams)
                                : GetImageByProductId_Enhanced(cd.MaSanPham, allSanPhams),

                            // ✅ FIXED: Combo details với actual product mapping
                            Combo = cd.MaCombo != null && cd.MaComboNavigation != null ? new
                            {
                                TenCombo = cd.MaComboNavigation.TenComBo,
                                GiaCombo = cd.MaComboNavigation.TongGia,
                                SanPhamsTrongCombo = cd.MaComboNavigation.ChiTietComBos.Select(ct =>
                                {
                                    // Get actual product from supports
                                    var actualProductCode = GetActualProductFromSupports(cd.MaCtdh, ct.MaChiTietComBo, allSupports) ?? ct.MaSanPham;

                                    Console.WriteLine($"[DEBUG] Order {d.MaDonHang}, ChiTiet {cd.MaCtdh}, ComboItem {ct.MaChiTietComBo}: Base={ct.MaSanPham}, Actual={actualProductCode}");

                                    return new
                                    {
                                        TenSanPham = GetProductNameByCode_Fixed(ct.MaSanPham, allSanPhams),
                                        SoLuong = ct.SoLuong,
                                        Gia = GetProductPriceByCode_Fixed(ct.MaSanPham, allSanPhams),
                                        ThanhTien = GetProductPriceByCode_Fixed(ct.MaSanPham, allSanPhams) * (ct.SoLuong ?? 0),

                                        // Use actual product code with color/size
                                        MaSanPham = actualProductCode,
                                        MauSac = ExtractColorFromProductCode(actualProductCode),
                                        KichThuoc = ExtractSizeFromProductCode(actualProductCode),

                                        // Always use base product for image
                                        HinhAnh = GetImageByProductId_Enhanced(ct.MaSanPham, allSanPhams)
                                    };
                                }).ToList()
                            } : null
                        };
                    }).ToList()
                }).ToList();

                Console.WriteLine($"[DEBUG] Returning {result.Count} processed orders");
                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Exception in GetOrders: {ex.Message}");
                Console.WriteLine($"[ERROR] Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { message = "Internal server error", error = ex.Message });
            }
        }

        // ✅ ENHANCED HELPER METHODS
        private string GetActualProductFromSupports(int chiTietDonHangId, int maChiTietCombo, List<DonHangSupport> allSupports)
        {
            try
            {
                // First try exact match
                var exactMatch = allSupports.FirstOrDefault(s =>
                    s.ChiTietGioHang == chiTietDonHangId && s.MaChiTietCombo == maChiTietCombo);

                if (exactMatch != null)
                {
                    Console.WriteLine($"[DEBUG] Found exact support match: {exactMatch.MaSanPham}");
                    return exactMatch.MaSanPham;
                }

                // Try by ChiTietCombo only (latest support for this combo item)
                var latestByCombo = allSupports
                    .Where(s => s.MaChiTietCombo == maChiTietCombo && s.ChiTietGioHang == 0)
                    .OrderByDescending(s => s.ID)
                    .FirstOrDefault();

                if (latestByCombo != null)
                {
                    Console.WriteLine($"[DEBUG] Found latest combo support match: {latestByCombo.MaSanPham}");
                    return latestByCombo.MaSanPham;
                }

                // Fallback: try by ChiTietGioHang only
                var fallback = allSupports.FirstOrDefault(s => s.ChiTietGioHang == chiTietDonHangId);
                if (fallback != null)
                {
                    Console.WriteLine($"[DEBUG] Found fallback support match: {fallback.MaSanPham}");
                    return fallback.MaSanPham;
                }

                Console.WriteLine($"[DEBUG] No support found for ChiTiet={chiTietDonHangId}, ComboItem={maChiTietCombo}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Error getting actual product from supports: {ex.Message}");
                return null;
            }
        }

        private string GetComboImage(ComBoSanPham combo, List<SanPham> allSanPhams)
        {
            if (combo?.ChiTietComBos?.Any() != true) return null;

            var firstProduct = combo.ChiTietComBos.FirstOrDefault();
            return firstProduct != null ? GetImageByProductId_Enhanced(firstProduct.MaSanPham, allSanPhams) : null;
        }

        private string GetImageByProductId_Enhanced(string productId, List<SanPham> allSanPhams)
        {
            if (string.IsNullOrEmpty(productId)) return null;

            try
            {
                // Method 1: Direct database lookup
                var exactMatch = _context.HinhAnhs
                    .Where(ha => ha.MaSanPham == productId)
                    .Select(ha => ha.Link)
                    .FirstOrDefault();

                if (!string.IsNullOrEmpty(exactMatch))
                    return exactMatch;

                // Method 2: Base product lookup
                var baseProductId = productId.Contains("_") ? productId.Split('_')[0] : productId;

                var baseMatch = _context.HinhAnhs
                    .Where(ha => ha.MaSanPham == baseProductId || ha.MaSanPham.StartsWith(baseProductId + "_"))
                    .Select(ha => ha.Link)
                    .FirstOrDefault();

                if (!string.IsNullOrEmpty(baseMatch))
                    return baseMatch;

                // Method 3: Use preloaded data
                var productWithImage = allSanPhams?.FirstOrDefault(sp =>
                    sp.MaSanPham == productId ||
                    sp.MaSanPham == baseProductId ||
                    (sp.MaSanPham != null && sp.MaSanPham.StartsWith(baseProductId + "_")));

                return productWithImage?.HinhAnhs?.FirstOrDefault()?.Link;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] Error getting image for product {productId}: {ex.Message}");
                return null;
            }
        }

        private string GetProductNameByCode_Fixed(string productCode, List<SanPham> allSanPhams)
        {
            if (string.IsNullOrEmpty(productCode) || allSanPhams == null)
                return "Sản phẩm không tồn tại";

            var baseProductId = productCode.Contains("_") ? productCode.Split('_')[0] : productCode;

            var product = allSanPhams.FirstOrDefault(sp =>
                sp.MaSanPham == productCode ||
                sp.MaSanPham == baseProductId ||
                (sp.MaSanPham != null && sp.MaSanPham.StartsWith(baseProductId + "_")));

            return product?.TenSanPham ?? "Sản phẩm không tồn tại";
        }

        private decimal GetProductPriceByCode_Fixed(string productCode, List<SanPham> allSanPhams)
        {
            if (string.IsNullOrEmpty(productCode) || allSanPhams == null)
                return 0;

            var baseProductId = productCode.Contains("_") ? productCode.Split('_')[0] : productCode;

            var product = allSanPhams.FirstOrDefault(sp =>
                sp.MaSanPham == productCode ||
                sp.MaSanPham == baseProductId ||
                (sp.MaSanPham != null && sp.MaSanPham.StartsWith(baseProductId + "_")));

            return product?.Gia ?? 0;
        }

        private string ExtractColorFromProductCode(string productCode)
        {
            if (string.IsNullOrEmpty(productCode)) return null;

            var parts = productCode.Split('_');
            if (parts.Length >= 2)
            {
                var colorCode = parts[1].ToLower();
                var colorMap = new Dictionary<string, string>
                {
                    {"ff0000", "Đỏ"},
                    {"0000ff", "Xanh dương"},
                    {"00ff00", "Xanh lá"},
                    {"ffffff", "Trắng"},
                    {"000000", "Đen"},
                    {"ff00ff", "Hồng"},
                    {"0c06f5", "Xanh navy"},
                    {"ffff00", "Vàng"},
                    {"ffa500", "Cam"},
                    {"800080", "Tím"},
                    {"a52a2a", "Nâu"},
                    {"808080", "Xám"},
                    {"c0c0c0", "Bạc"},
                    {"ffc0cb", "Hồng nhạt"}
                };
                return colorMap.ContainsKey(colorCode) ? colorMap[colorCode] : $"#{colorCode}";
            }
            return null;
        }

        private string ExtractSizeFromProductCode(string productCode)
        {
            if (string.IsNullOrEmpty(productCode)) return null;

            var parts = productCode.Split('_');
            if (parts.Length >= 3)
            {
                var sizeCode = parts[2];
                var sizeMap = new Dictionary<string, string>
                {
                    {"S", "S"}, {"M", "M"}, {"L", "L"},
                    {"XL", "XL"}, {"XXL", "XXL"}, {"XXXL", "XXXL"}
                };
                return sizeMap.ContainsKey(sizeCode) ? sizeMap[sizeCode] : sizeCode;
            }
            return null;
        }

        // ✅ KEEP: All existing methods for backwards compatibility
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrdersByUserId(string id)
        {
            if (string.IsNullOrEmpty(id) || id == "undefined")
            {
                return BadRequest(new { message = "ID người dùng không hợp lệ." });
            }

            var allSanPhams = await _context.SanPhams
                .Include(sp => sp.HinhAnhs)
                .AsNoTracking()
                .ToListAsync();

            var allSupports = await _context.DonHangSupports
                .AsNoTracking()
                .ToListAsync();

            var ordersQuery = await _context.DonHangs
                .Where(d => d.MaNguoiDung == id)
                .Include(d => d.MaNguoiDungNavigation)
                .Include(d => d.ChiTietDonHangs)
                .ThenInclude(cd => cd.MaSanPhamNavigation)
                .ThenInclude(sp => sp.HinhAnhs)
                .Include(d => d.ChiTietDonHangs)
                .ThenInclude(cd => cd.MaComboNavigation)
                .ThenInclude(c => c.ChiTietComBos)
                .ThenInclude(ct => ct.MaSanPhamNavigation)
                .ThenInclude(sp => sp.HinhAnhs)
                .OrderByDescending(d => d.NgayDat)
                .Select(d => new
                {
                    MaDonHang = d.MaDonHang,
                    TenNguoiNhan = d.TenNguoiNhan,
                    NgayDat = d.NgayDat != null ? d.NgayDat.Value.ToString("dd/MM/yyyy") : DateTime.UtcNow.ToString("dd/MM/yyyy"),
                    TrangThaiDonHang = (int)d.TrangThaiDonHang,
                    TrangThaiThanhToan = (int)d.TrangThaiHang,
                    HinhThucThanhToan = d.TrangThaiHang == TrangThaiThanhToan.ThanhToanKhiNhanHang ? "COD" : "VNPay",
                    LyDoHuy = d.LyDoHuy,
                    TongTien = d.ChiTietDonHangs.Sum(cd => cd.ThanhTien ?? 0),
                    FinalAmount = d.FinalAmount ?? 0,
                    SanPhams = d.ChiTietDonHangs.Select(cd => new
                    {
                        MaChiTietDh = cd.MaCtdh,
                        LaCombo = cd.MaCombo != null,
                        TenSanPham = cd.MaCombo != null
                            ? cd.MaComboNavigation != null ? cd.MaComboNavigation.TenComBo : "Combo không tồn tại"
                            : cd.MaSanPhamNavigation != null ? cd.MaSanPhamNavigation.TenSanPham : "Sản phẩm không tồn tại",
                        SoLuong = cd.SoLuong,
                        Gia = cd.Gia,
                        ThanhTien = cd.ThanhTien,
                        MaCombo = cd.MaCombo,
                        MaSanPham = cd.MaSanPham,

                        MauSac = cd.MaCombo == null && !string.IsNullOrEmpty(cd.MaSanPham) ? ParseColorFromProductId(cd.MaSanPham) : null,
                        KichThuoc = cd.MaCombo == null && !string.IsNullOrEmpty(cd.MaSanPham) ? ParseSizeFromProductId(cd.MaSanPham) : null,

                        HinhAnh = GetImageByProductId(cd.MaSanPham, allSanPhams),
                        Combo = cd.MaCombo != null && cd.MaComboNavigation != null ? new
                        {
                            TenCombo = cd.MaComboNavigation.TenComBo,
                            GiaCombo = cd.MaComboNavigation.TongGia,
                            SanPhamsTrongCombo = cd.MaComboNavigation.ChiTietComBos.Select(ct => new
                            {
                                TenSanPham = GetProductNameByCode(ct.MaSanPham, allSanPhams),
                                SoLuong = ct.SoLuong,
                                Gia = GetProductPriceByCode(ct.MaSanPham, allSanPhams),
                                ThanhTien = GetProductPriceByCode(ct.MaSanPham, allSanPhams) * ct.SoLuong,

                                // ✅ SỬA: Sử dụng enhanced method
                                MaSanPham = GetActualProductFromComboOrderEnhanced(cd.MaCtdh, ct.MaChiTietComBo, ct.MaSanPham),
                                MauSac = ParseColorFromProductId(GetActualProductFromComboOrderEnhanced(cd.MaCtdh, ct.MaChiTietComBo, ct.MaSanPham)),
                                KichThuoc = ParseSizeFromProductId(GetActualProductFromComboOrderEnhanced(cd.MaCtdh, ct.MaChiTietComBo, ct.MaSanPham)),

                                HinhAnh = GetImageByProductId(ct.MaSanPham, allSanPhams)
                            })
                        } : null
                    }).ToList(),
                    ThongTinNguoiDung = new
                    {
                        TenNguoiNhan = d.TenNguoiNhan,
                        DiaChi = d.DiaChi,
                        Sdt = d.Sdt,
                        TenNguoiDat = d.MaNguoiDungNavigation.HoTen
                    },
                    ThongTinDonHang = new
                    {
                        NgayDat = d.NgayDat != null ? d.NgayDat.Value.ToString("dd/MM/yyyy") : DateTime.UtcNow.ToString("dd/MM/yyyy"),
                        TrangThai = (int)d.TrangThaiDonHang,
                        ThanhToan = (int)d.TrangThaiHang,
                        HinhThucThanhToan = d.TrangThaiHang == TrangThaiThanhToan.ThanhToanKhiNhanHang ? "Thanh toán khi nhận hàng" : "Thanh toán VNPay"
                    }
                })
                .ToListAsync();

            if (ordersQuery == null || !ordersQuery.Any())
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng nào cho người dùng này." });
            }

            return Ok(ordersQuery);
        }

        [HttpPut("approve/{id}")]
        public async Task<IActionResult> ApproveOrder(int id, [FromBody] ApproveOrderRequest request)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                userId = request.UserId;
            }

            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { message = "Không thể xác định người duyệt đơn" });
            }

            var userExists = await _context.NguoiDungs.AnyAsync(u =>
                u.MaNguoiDung == userId ||
                u.Email == userId ||
                u.TaiKhoan == userId);

            if (!userExists)
            {
                return BadRequest(new { message = $"Người dùng {userId} không tồn tại trong hệ thống" });
            }

            var actualUserId = await _context.NguoiDungs
                .Where(u => u.MaNguoiDung == userId || u.Email == userId || u.TaiKhoan == userId)
                .Select(u => u.MaNguoiDung)
                .FirstOrDefaultAsync();

            var order = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs)
                .ThenInclude(cd => cd.MaComboNavigation)
                .FirstOrDefaultAsync(d => d.MaDonHang == id);

            if (order == null)
                return NotFound(new { message = "Đơn hàng không tồn tại" });

            if (order.TrangThaiDonHang != Data.TrangThaiDonHang.ChuaXacNhan &&
                order.TrangThaiDonHang != Data.TrangThaiDonHang.DangXuLy &&
                order.TrangThaiDonHang != Data.TrangThaiDonHang.DangGiaoHang)
            {
                return BadRequest(new { message = "Không thể duyệt đơn hàng ở trạng thái này" });
            }

            if (string.IsNullOrEmpty(order.MaNhanVien))
            {
                order.MaNhanVien = actualUserId;
            }
            else
            {
                if (order.MaNhanVien != actualUserId)
                {
                    return BadRequest(new { message = "Đơn hàng đã được gán cho nhân viên khác xử lý." });
                }
            }

            order.TrangThaiDonHang = (Data.TrangThaiDonHang)((int)order.TrangThaiDonHang + 1);

            if (order.TrangThaiDonHang == Data.TrangThaiDonHang.DaGiaoHang)
            {
                order.TrangThaiHang = Data.TrangThaiThanhToan.ThanhToanVNPay;
            }

            try
            {
                _context.DonHangs.Update(order);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Duyệt đơn thành công", assignedStaff = actualUserId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi lưu dữ liệu: {ex.Message}" });
            }
        }

        [HttpGet("cancelled")]
        public async Task<IActionResult> GetCancelledOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            if (page <= 0) page = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 10;

            var allSanPhams = await _context.SanPhams
                .Include(sp => sp.HinhAnhs)
                .AsNoTracking()
                .ToListAsync();

            var allSupports = await _context.DonHangSupports
                .AsNoTracking()
                .ToListAsync();

            var totalCancelledOrders = await _context.DonHangs
                .Where(d => d.TrangThaiDonHang == Data.TrangThaiDonHang.DaHuy)
                .CountAsync();

            var cancelledOrders = await _context.DonHangs
                .Where(d => d.TrangThaiDonHang == Data.TrangThaiDonHang.DaHuy)
                .Include(d => d.MaNguoiDungNavigation)
                .Include(d => d.MaNhanVienNavigation)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(cd => cd.MaSanPhamNavigation)
                    .ThenInclude(sp => sp.HinhAnhs)
                .Include(d => d.ChiTietDonHangs)
                    .ThenInclude(cd => cd.MaComboNavigation)
                    .ThenInclude(c => c.ChiTietComBos)
                    .ThenInclude(ct => ct.MaSanPhamNavigation)
                    .ThenInclude(sp => sp.HinhAnhs)
                .OrderByDescending(d => d.NgayDat)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync();

            var result = cancelledOrders.Select(d => new
            {
                MaDonHang = d.MaDonHang,
                TenNguoiNhan = d.TenNguoiNhan,
                NgayDat = d.NgayDat != null ? d.NgayDat.Value.ToString("dd/MM/yyyy HH:mm") : "",
                TrangThaiDonHang = (int)d.TrangThaiDonHang,
                TrangThaiThanhToan = (int)d.TrangThaiHang,
                HinhThucThanhToan = d.TrangThaiHang == TrangThaiThanhToan.ThanhToanKhiNhanHang ? "COD" : "VNPay",
                LyDoHuy = d.LyDoHuy,
                TongTien = d.ChiTietDonHangs.Sum(cd => cd.ThanhTien ?? 0),
                FinalAmount = d.FinalAmount,
                DiscountAmount = d.DiscountAmount,
                ShippingFee = d.ShippingFee,

                TenSanPhamHoacCombo = d.ChiTietDonHangs.Select(cd => cd.MaCombo != null
                    ? (cd.MaComboNavigation != null ? cd.MaComboNavigation.TenComBo : "Combo không tồn tại")
                    : (cd.MaSanPhamNavigation != null ? cd.MaSanPhamNavigation.TenSanPham : "Sản phẩm không tồn tại"))
                    .FirstOrDefault(),

                TongSoSanPham = d.ChiTietDonHangs.Sum(cd => cd.SoLuong ?? 0),

                MaNhanVien = d.MaNhanVien,
                HoTenNhanVien = d.MaNhanVienNavigation != null ? d.MaNhanVienNavigation.HoTen : "Chưa có nhân viên xử lý",

                MaNguoiDung = d.MaNguoiDung,
                HoTenKhachHang = d.MaNguoiDungNavigation != null ? d.MaNguoiDungNavigation.HoTen : "Khách hàng không tồn tại",

                DiaChi = d.DiaChi,
                SoDienThoai = d.Sdt,

                ChiTietSanPhams = d.ChiTietDonHangs.Select(cd => new
                {
                    MaChiTietDh = cd.MaCtdh,
                    LaCombo = cd.MaCombo != null,
                    TenSanPham = cd.MaCombo != null
                        ? (cd.MaComboNavigation != null ? cd.MaComboNavigation.TenComBo : "Combo không tồn tại")
                        : (cd.MaSanPhamNavigation != null ? cd.MaSanPhamNavigation.TenSanPham : "Sản phẩm không tồn tại"),
                    SoLuong = cd.SoLuong,
                    Gia = cd.Gia,
                    ThanhTien = cd.ThanhTien,
                    MaCombo = cd.MaCombo,
                    MaSanPham = cd.MaSanPham,

                    MauSac = cd.MaCombo == null && !string.IsNullOrEmpty(cd.MaSanPham) ? ParseColorFromProductId(cd.MaSanPham) : null,
                    KichThuoc = cd.MaCombo == null && !string.IsNullOrEmpty(cd.MaSanPham) ? ParseSizeFromProductId(cd.MaSanPham) : null,

                    HinhAnh = cd.MaCombo != null
                        ? (cd.MaComboNavigation != null && cd.MaComboNavigation.ChiTietComBos.Any()
                            ? GetImageByProductId(cd.MaComboNavigation.ChiTietComBos.FirstOrDefault().MaSanPham, allSanPhams)
                            : null)
                        : GetImageByProductId(cd.MaSanPham, allSanPhams),

                    Combo = cd.MaCombo != null && cd.MaComboNavigation != null ? new
                    {
                        TenCombo = cd.MaComboNavigation.TenComBo,
                        GiaCombo = cd.MaComboNavigation.TongGia,
                        SanPhamsTrongCombo = cd.MaComboNavigation.ChiTietComBos.Select(ct => new
                        {
                            TenSanPham = GetProductNameByCode(ct.MaSanPham, allSanPhams),
                            SoLuong = ct.SoLuong,
                            Gia = GetProductPriceByCode(ct.MaSanPham, allSanPhams),
                            ThanhTien = GetProductPriceByCode(ct.MaSanPham, allSanPhams) * ct.SoLuong,

                            // ✅ SỬA: Sử dụng enhanced method
                            MaSanPham = GetActualProductFromComboOrderEnhanced(cd.MaCtdh, ct.MaChiTietComBo, ct.MaSanPham),
                            MauSac = ParseColorFromProductId(GetActualProductFromComboOrderEnhanced(cd.MaCtdh, ct.MaChiTietComBo, ct.MaSanPham)),
                            KichThuoc = ParseSizeFromProductId(GetActualProductFromComboOrderEnhanced(cd.MaCtdh, ct.MaChiTietComBo, ct.MaSanPham)),

                            HinhAnh = GetImageByProductId(ct.MaSanPham, allSanPhams)
                        }).ToList()
                    } : null
                }).ToList()
            }).ToList();

            var totalPages = (int)Math.Ceiling((double)totalCancelledOrders / pageSize);
            var hasNextPage = page < totalPages;
            var hasPreviousPage = page > 1;

            var response = new
            {
                Data = result,
                Pagination = new
                {
                    CurrentPage = page,
                    PageSize = pageSize,
                    TotalRecords = totalCancelledOrders,
                    TotalPages = totalPages,
                    HasNextPage = hasNextPage,
                    HasPreviousPage = hasPreviousPage
                },
                Summary = new
                {
                    TotalCancelledOrders = totalCancelledOrders,
                    TotalCancelledAmount = result.Sum(r => r.TongTien),
                    TotalFinalAmount = result.Sum(r => r.FinalAmount ?? 0)
                }
            };

            return Ok(response);
        }

        [HttpPut("cancel/{id}")]
        public async Task<IActionResult> CancelOrder(int id, [FromBody] string lyDoHuy)
        {
            var order = await _context.DonHangs.FindAsync(id);
            if (order == null)
            {
                return NotFound(new { message = "Đơn hàng không tồn tại" });
            }

            if (order.TrangThaiDonHang != Data.TrangThaiDonHang.ChuaXacNhan &&
                 order.TrangThaiDonHang != Data.TrangThaiDonHang.DangXuLy)
            {
                return BadRequest(new { message = "Chỉ có thể hủy đơn hàng khi chưa xác nhận hoặc đang xử lý" });
            }

            if (string.IsNullOrEmpty(lyDoHuy))
            {
                return BadRequest(new { message = "Lý do hủy không được để trống" });
            }

            order.TrangThaiDonHang = Data.TrangThaiDonHang.DaHuy;
            order.LyDoHuy = lyDoHuy;

            try
            {
                _context.DonHangs.Update(order);
                await _context.SaveChangesAsync();
                return Ok(new { message = "Hủy đơn thành công" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Lỗi khi hủy đơn: {ex.Message}" });
            }
        }

        [HttpGet("debug-combo/{orderId}")]
        public async Task<IActionResult> DebugComboMapping(int orderId)
        {
            var order = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs)
                .ThenInclude(cd => cd.MaComboNavigation)
                .ThenInclude(c => c.ChiTietComBos)
                .Where(d => d.MaDonHang == orderId)
                .FirstOrDefaultAsync();

            if (order == null)
                return NotFound("Order not found");

            var debugResult = new List<object>();

            foreach (var chiTiet in order.ChiTietDonHangs.Where(cd => cd.MaCombo != null))
            {
                var comboItems = new List<object>();

                foreach (var comboProduct in chiTiet.MaComboNavigation.ChiTietComBos)
                {
                    var actualProduct = GetActualProductFromComboOrder(chiTiet.MaCtdh, comboProduct.MaChiTietComBo);
                    var enhancedProduct = GetActualProductFromComboOrderEnhanced(chiTiet.MaCtdh, comboProduct.MaChiTietComBo, comboProduct.MaSanPham);

                    comboItems.Add(new
                    {
                        MaChiTietComBo = comboProduct.MaChiTietComBo,
                        BaseProductCode = comboProduct.MaSanPham,
                        ActualProductCode = actualProduct,
                        EnhancedProductCode = enhancedProduct,
                        ParsedColor = ParseColorFromProductId(enhancedProduct),
                        ParsedSize = ParseSizeFromProductId(enhancedProduct),

                        FoundInSupports = _context.DonHangSupports
                            .Where(s => s.ChiTietGioHang == chiTiet.MaCtdh && s.MaChiTietCombo == comboProduct.MaChiTietComBo)
                            .Select(s => new { s.ID, s.MaSanPham, s.ChiTietGioHang, s.MaChiTietCombo })
                            .ToList()
                    });
                }

                debugResult.Add(new
                {
                    ChiTietDonHangId = chiTiet.MaCtdh,
                    ComboId = chiTiet.MaCombo,
                    ComboProducts = comboItems
                });
            }

            return Ok(debugResult);
        }

        [HttpGet("debug-supports/{orderId}")]
        public async Task<IActionResult> DebugSupportsData(int orderId)
        {
            var order = await _context.DonHangs
                .Include(d => d.ChiTietDonHangs)
                .ThenInclude(cd => cd.MaComboNavigation)
                .ThenInclude(c => c.ChiTietComBos)
                .Where(d => d.MaDonHang == orderId)
                .FirstOrDefaultAsync();

            if (order == null)
                return NotFound("Order not found");

            var result = new
            {
                OrderId = orderId,
                OrderDetails = order.ChiTietDonHangs.Select(cd => new
                {
                    ChiTietDonHangId = cd.MaCtdh,
                    IsCombo = cd.MaCombo != null,
                    ComboId = cd.MaCombo,

                    // All supports for this order detail
                    Supports = _context.DonHangSupports
                        .Where(s => s.ChiTietGioHang == cd.MaCtdh)
                        .Select(s => new
                        {
                            s.ID,
                            s.MaSanPham,
                            s.MaChiTietCombo,
                            s.ChiTietGioHang,
                            s.SoLuong,
                            s.Version
                        })
                        .ToList(),

                    // Combo details if applicable
                    ComboDetails = cd.MaCombo != null ? cd.MaComboNavigation.ChiTietComBos.Select(ct => new
                    {
                        ct.MaChiTietComBo,
                        ct.MaSanPham,
                        ct.SoLuong,

                        // Expected vs Actual
                        ExpectedProduct = ct.MaSanPham,
                        ActualProduct = _context.DonHangSupports
                            .Where(s => s.ChiTietGioHang == cd.MaCtdh && s.MaChiTietCombo == ct.MaChiTietComBo)
                            .Select(s => s.MaSanPham)
                            .FirstOrDefault()
                    }).ToList() : null
                }).ToList()
            };

            return Ok(result);
        }



        private string GetActualProductFromComboOrderEnhanced(int chiTietDonHangId, int maChiTietCombo, string baseProductCode)
        {
            try
            {
                var allSupports = _context.DonHangSupports.ToList();
                return GetActualProductFromSupports(chiTietDonHangId, maChiTietCombo, allSupports) ?? baseProductCode;
            }
            catch
            {
                return baseProductCode;
            }
        }

        private string GetActualProductFromComboOrder(int chiTietDonHangId, int maChiTietCombo)
        {
            try
            {
                return _context.DonHangSupports
                    .Where(s => s.ChiTietGioHang == chiTietDonHangId && s.MaChiTietCombo == maChiTietCombo)
                    .Select(s => s.MaSanPham)
                    .FirstOrDefault();
            }
            catch
            {
                return null;
            }
        }

        private string ParseColorFromProductId(string productId)
        {
            return ExtractColorFromProductCode(productId);
        }

        private string ParseSizeFromProductId(string productId)
        {
            return ExtractSizeFromProductCode(productId);
        }

        private string GetImageByProductId(string productId, List<SanPham> allSanPhams = null)
        {
            return GetImageByProductId_Enhanced(productId, allSanPhams);
        }

        private string GetProductNameByCode(string productCode, List<SanPham> allSanPhams)
        {
            return GetProductNameByCode_Fixed(productCode, allSanPhams);
        }

        private decimal GetProductPriceByCode(string productCode, List<SanPham> allSanPhams)
        {
            return GetProductPriceByCode_Fixed(productCode, allSanPhams);
        }

        public class ApproveOrderRequest
        {
            public string UserId { get; set; }
        }

        public enum TrangThaiDonHang
        {
            ChuaXacNhan = 0,
            DangXuLy = 1,
            DangGiaoHang = 2,
            DaGiaoHang = 3,
            DaHuy = 4
        }
    }
}