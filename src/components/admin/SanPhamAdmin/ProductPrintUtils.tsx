import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Swal from 'sweetalert2';
import MagnifierComponent from '@/components/MagnifierComponent/MagnifierComponent';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

// Interface for product data
interface Product {
  maSanPham: string;
  tenSanPham: string;
  gia: number;
  chatLieu?: string;
  thuongHieu?: string;
  mauSac?: string;
  loaiSanPham?: string;
  hinh?: string[];
  soLuong?: number;
  soLuongDaBan?: number;
  giaNhap?: number;
  trangThai?: number;
}

// Function to convert hex to RGB
const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// Function to format price
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

// Function to wait for images to load with retry
const waitForImages = (container: HTMLElement, maxRetries: number = 5): Promise<boolean[]> => {
  const images = container.getElementsByTagName('img');
  const promises = Array.from(images).map((img, index) =>
    new Promise<boolean>((resolve) => {
      let retries = 0;
      const checkImage = () => {
        if (img.complete && img.naturalHeight !== 0) {
          resolve(true);
        } else if (retries < maxRetries) {
          retries++;
          setTimeout(checkImage, 2000);
        } else {
          console.error(`Failed to load image after ${maxRetries} retries: ${img.src}`);
          resolve(false);
        }
      };
      checkImage();
    })
  );
  return Promise.all(promises);
};

// Function to generate CODE128 barcode on a canvas
const generateCode128Barcode = (canvas: HTMLCanvasElement, text: string, options: { width: number; height: number }) => {
  if (!canvas || !text) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const CODE128 = {
    B: {
      ' ': 0, '!': 1, '"': 2, '#': 3, '$': 4, '%': 5, '&': 6, "'": 7, '(': 8, ')': 9,
      '*': 10, '+': 11, ',': 12, '-': 13, '.': 14, '/': 15, '0': 16, '1': 17, '2': 18, '3': 19,
      '4': 20, '5': 21, '6': 22, '7': 23, '8': 24, '9': 25, ':': 26, ';': 27, '<': 28, '=': 29,
      '>': 30, '?': 31, '@': 32, 'A': 33, 'B': 34, 'C': 35, 'D': 36, 'E': 37, 'F': 38, 'G': 39,
      'H': 40, 'I': 41, 'J': 42, 'K': 43, 'L': 44, 'M': 45, 'N': 46, 'O': 47, 'P': 48, 'Q': 49,
      'R': 50, 'S': 51, 'T': 52, 'U': 53, 'V': 54, 'W': 55, 'X': 56, 'Y': 57, 'Z': 58, '[': 59,
      '\\': 60, ']': 61, '^': 62, '_': 63, '`': 64, 'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69,
      'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79,
      'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89,
      'z': 90, '{': 91, '|': 92, '}': 93, '~': 94, 'FNC3': 95, 'FNC2': 96, 'SHIFT': 97, 'CODEC': 98,
      'F_latitude': 99, 'FNC1': 100, 'STARTB': 104, 'STOP': 106,
    },
    PATTERNS: [
      '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', '10001001100',
      '10011001000', '10011000100', '10001100100', '11001001000', '11001000100', '11000100100',
      '10110011100', '10011011100', '10011001110', '10111001100', '10011101100', '10011100110',
      '11001110010', '11001011100', '11001001110', '11011100100', '11001110100', '11101101110',
      '11101001100', '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
      '11011011000', '11011000110', '11000110110', '10100011000', '10001011000', '10001001110',
      '10110001000', '10001101000', '10001100110', '11010001000', '11000101000', '11000100110',
      '10110111000', '10110001110', '10001101110', '10111011000', '10111000110', '10001110110',
      '11101110110', '11010001110', '11000101110', '11011101000', '11011100110', '11011100010',
      '11011011100', '11011001110', '11011000110', '11000110110', '11100010110', '11100010011',
      '11101011000', '11101000110', '11100101110', '11101101000', '11101100110', '11101100010',
      '11100111100', '11100110011', '11101111000', '11000010100', '10000101100', '10000100110',
      '10110010000', '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
      '11000010010', '10001001010', '10111010000', '10111000010', '10001010100', '10001010010',
      '11110111010', '11000001110', '11110001010', '10100111000', '10100001100', '10010111000',
      '10010001110', '10000101110', '10000100111', '10111100100', '10111100010', '10110011110',
      '10011110110', '10011110011', '11110100100', '11110100010', '11110010100', '11110010010',
      '11011010110', '11010110110', '11010110011', '11010010111', '11010010011', '11010000111',
    ],
  };

  const sanitizedText = text.replace(/[^A-Za-z0-9_]/g, '').slice(0, 20);
  if (sanitizedText !== text) {
    console.warn(`Barcode text sanitized from "${text}" to "${sanitizedText}" due to invalid characters.`);
  }

  let sum = 104;
  let checksum = sum;
  const chars = ['STARTB'];

  for (let i = 0; i < sanitizedText.length; i++) {
    const char = sanitizedText[i];
    const value = CODE128.B[char] ?? 0;
    chars.push(char);
    sum += value * (i + 1);
    checksum = sum % 103;
  }

  chars.push(Object.keys(CODE128.B)[checksum % 94]);
  chars.push('STOP');

  let pattern = '';
  for (const char of chars) {
    const value = CODE128.B[char as keyof typeof CODE128.B];
    pattern += CODE128.PATTERNS[value];
  }

  canvas.width = options.width;
  canvas.height = options.height;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const barCount = pattern.length;
  const barWidth = canvas.width / barCount;

  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000000';
  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === '1') {
      ctx.fillRect(i * barWidth, 0, Math.ceil(barWidth), canvas.height);
    }
  }
};

// Function to create product card for PDF
const createProductCardForPDF = (product: Product) => {
  if (!product.maSanPham) {
    console.error('Missing maSanPham for product:', product);
    return createEmptyCard();
  }

  const [baseId, colorHex, size] = product.maSanPham.split('_');
  const colorRgb = hexToRgb(colorHex);
  const colorName = colorRgb ? `RGB(${colorRgb.r},${colorRgb.g},${colorRgb.b})` : 'N/A';

  const cardElement = document.createElement('div');
  cardElement.style.cssText = `
    width: 210mm;
    height: 297mm;
    background: white;
    border: 2px solid #000;
    padding: 8mm;
    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: Arial, sans-serif;
    font-size: 14px;
    color: #000;
    page-break-inside: avoid;
  `;

  cardElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5mm; border-bottom: 1px solid #000; padding-bottom: 5mm; width: 100%;">
      <div style="font-weight: bold; font-size: 16px; text-align: left; white-space: pre-line;">
        Cửa Hàng Thời Trang\nFashionHub
      </div>
      <img src="https://fashionhub.name.vn/logo.png" alt="FashionHub" style="height: 25mm; max-width: 80mm;" />
    </div>
    <div style="text-align: center; margin-bottom: 5mm; width: 100%; margin-top: 10mm;">
      <div style="font-weight: bold; font-size: 28px;">${product.tenSanPham || 'N/A'}</div>
    </div>
    <div style="text-align: center; margin-bottom: 5mm; width: 100%;">
      <canvas id="barcode-canvas-${product.maSanPham}" style="height: 15mm; width: 100mm; border: 1px solid #000; margin: 0 auto; display: block;"></canvas>
      <div style="font-size: 12px; margin-top: 2mm; font-weight: bold;">${product.maSanPham}</div>
    </div>
    <div style="text-align: center; margin-bottom: 5mm; width: 100%;">
      <div style="font-weight: bold; font-size: 16px;">SIZE</div>
      <div style="font-size: 20px; font-weight: bold;">${size?.trim() || 'N/A'}</div>
    </div>
    <div style="text-align: center; margin-bottom: 5mm; width: 100%;">
      <div style="font-weight: bold; font-size: 16px;">MÀU</div>
      <div style="font-size: 14px;">${colorName}</div>
    </div>
    <div style="text-align: center; margin-bottom: 5mm; width: 100%;">
      <div style="font-weight: bold; font-size: 16px;">GIÁ</div>
      <div style="font-size: 22px; font-weight: bold;">${formatPrice(product.gia || 0)}</div>
    </div>
    <div style="text-align: center; margin-bottom: 5mm; width: 100%;">
      <div style="font-weight: bold; font-size: 16px;">CHẤT LIỆU</div>
      <div style="font-size: 14px;">${product.chatLieu || 'N/A'}</div>
    </div>
    <div style="text-align: center; margin-bottom: 5mm; width: 100%;">
      <div style="font-weight: bold; font-size: 16px;">THƯƠNG HIỆU</div>
      <div style="font-size: 14px;">${product.thuongHieu || 'N/A'}</div>
    </div>
    <div style="text-align: center; margin-bottom: 5mm; width: 100%;">
      <div style="font-weight: bold; font-size: 16px;">LOẠI SẢN PHẨM</div>
      <div style="font-size: 14px;">${product.loaiSanPham || 'N/A'}</div>
    </div>
    <div style="text-align: center; margin-bottom: 5mm; padding: 3mm; width: 70%;">
      <img
        src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
          `https://fashionhub.name.vn/products/${product.maSanPham}`
        )}&size=200x200"
        alt="QR Code"
        style="width: 60mm; height: 60mm; border: 1px solid #000; margin: 0 auto; display: block;"
      />
    </div>
    <div style="text-align: center; font-size: 12px; margin-top: auto; border-top: 1px solid #000; padding-top: 4mm; width: 100%;">
      Ngày in: ${new Date().toLocaleDateString('vi-VN')}
    </div>
  `;

  const canvas = cardElement.querySelector(`#barcode-canvas-${product.maSanPham}`) as HTMLCanvasElement;
  if (canvas) {
    generateCode128Barcode(canvas, product.maSanPham, {
      width: 250,
      height: 40,
    });
  }

  return cardElement;
};

// Function to create empty card
const createEmptyCard = () => {
  const emptyCard = document.createElement('div');
  emptyCard.style.cssText = `
    width: 210mm;
    height: 297mm;
    background: white;
    border: 2px solid #000;
    padding: 15mm;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    font-family: Arial, sans-serif;
    font-size: 18px;
    color: #000;
    page-break-inside: avoid;
  `;
  emptyCard.innerHTML = `<div style="font-weight: bold;">Dữ liệu sản phẩm không hợp lệ</div>`;
  return emptyCard;
};

// Function to create small preview card (A6 size)
const createSmallPreviewCard = (product: Product) => {
  const [baseId, colorHex, size] = product.maSanPham.split('_');
  const colorRgb = hexToRgb(colorHex);
  const colorName = colorRgb ? `RGB(${colorRgb.r},${colorRgb.g},${colorRgb.b})` : 'N/A';

  return `
    <div class="preview-card-small" data-product-id="${product.maSanPham}" style="
      width: 105mm;
      height: 148mm;
      background: white;
      border: 1px solid #000;
      padding: 5mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      font-family: Arial, sans-serif;
      font-size: 10px;
      color: #000;
      margin: 0 5mm;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; border-bottom: 1px solid #000; padding-bottom: 2mm; width: 100%;">
        <div style="font-weight: bold; font-size: 12px; text-align: left; white-space: pre-line;">
          Cửa Hàng Thời Trang\nFashionHub
        </div>
        <img src="../../../public/logo.png" alt="FashionHub" style="height: 20mm; max-width: 60mm;" />
      </div>
      <div style="text-align: center; margin-bottom: 2mm; width: 100%; margin-top: 10mm">
        <div style="font-weight: bold; font-size: 25px;">${product.tenSanPham || 'N/A'}</div>
      </div>
      <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
        <canvas id="barcode-canvas-small-${product.maSanPham}" style="height: 8mm; width: 50mm; border: 1px solid #000; margin: 0 auto; display: block;"></canvas>
        <div style="font-size: 8px; margin-top: 1mm;">${product.maSanPham}</div>
      </div>
      <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
        <div style="font-weight: bold; font-size: 9px;">SIZE</div>
        <div style="font-size: 10px;">${size?.trim() || 'N/A'}</div>
      </div>
      <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
        <div style="font-weight: bold; font-size: 9px;">MÀU</div>
        <div style="font-size: 8px;">${colorName}</div>
      </div>
      <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
        <div style="font-weight: bold; font-size: 9px;">GIÁ</div>
        <div style="font-size: 10px; font-weight: bold;">${formatPrice(product.gia || 0)}</div>
      </div>
      <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
        <div style="font-weight: bold; font-size: 9px;">CHẤT LIỆU</div>
        <div style="font-size: 10px;">${product.chatLieu || 'N/A'}</div>
      </div>
      <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
        <div style="font-weight: bold; font-size: 9px;">THƯƠNG HIỆU</div>
        <div style="font-size: 10px;">${product.thuongHieu || 'N/A'}</div>
      </div>
      <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
        <div style="font-weight: bold; font-size: 9px;">LOẠI SẢN PHẨM</div>
        <div style="font-size: 10px;">${product.loaiSanPham || 'N/A'}</div>
      </div>
      <div style="text-align: center; margin-bottom: 2mm; padding: 1mm; width: 80%;">
        <img
          src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
            `https://fashionhub.name.vn/products/${product.maSanPham}`
          )}&size=120x120"
          alt="QR Code"
          style="width: 30mm; height: 30mm; border: 1px solid #000; margin: 0 auto; display: block;"
        />
      </div>
    </div>
  `;
};


// Function to print PDF with 6 cards per A4 page (3 columns x 2 rows)
export const printToPDF = async (selectedProducts: Set<string>) => {
  if (selectedProducts.size === 0) {
    Swal.fire({
      title: 'Thông báo',
      text: 'Vui lòng chọn ít nhất một sản phẩm để in.',
      icon: 'warning',
    });
    return;
  }

  try {
    // Fetch data từ API
    const allProductsData: Product[] = [];
    for (const productId of selectedProducts) {
      const response = await fetch(`https://bicacuatho.azurewebsites.net/api/SanPham/SanPhamByID?id=${productId}`);
      if (!response.ok) {
        throw new Error(`Không thể lấy dữ liệu cho sản phẩm ${productId}`);
      }
      const data = await response.json();
      allProductsData.push(...data);
    }

    if (allProductsData.length === 0) {
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể lấy dữ liệu sản phẩm từ API.',
        icon: 'error',
      });
      return;
    }

    // Function to create a compact product card (3 columns x 2 rows per A4)
    const createCompactProductCard = (product: Product) => {
      const [baseId, colorHex, size] = product.maSanPham.split('_');
      const colorRgb = hexToRgb(colorHex);
      const colorName = colorRgb ? `RGB(${colorRgb.r},${colorRgb.g},${colorRgb.b})` : 'N/A';

      return `
        <div class="compact-card" style="
          width: 65mm;
          height: 135mm;
          background: white;
          border: 2px solid #000;
          padding: 2mm;
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: Arial, sans-serif;
          color: #000;
          box-sizing: border-box;
          margin: 1mm;
          position: relative;
        ">
          <!-- Header với logo -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2mm; border-bottom: 1px solid #000; padding-bottom: 2mm; width: 100%;">
            <div style="font-weight: bold; font-size: 6px; text-align: left; line-height: 1.1;">
              Cửa Hàng<br>FashionHub
            </div>
            <img src="../../../public/logo.png" alt="Logo" style="height: 8mm; max-width: 20mm;" onerror="this.style.display='none'" />
          </div>
          
          <!-- Tên sản phẩm - TO HỚN -->
          <div style="text-align: center; margin-bottom: 3mm; width: 100%;">
            <div style="font-weight: bold; font-size: 14px; line-height: 1.2; color: #2c5aa0; min-height: 25mm; display: flex; align-items: center; justify-content: center;">
              ${product.tenSanPham || 'N/A'}
            </div>
          </div>
          
          <!-- Barcode -->
          <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
            <canvas id="barcode-canvas-${product.maSanPham}" style="height: 8mm; width: 55mm; border: 1px solid #000; margin: 0 auto; display: block;"></canvas>
            <div style="font-size: 6px; margin-top: 1mm; font-weight: bold;">${product.maSanPham}</div>
          </div>
          
          <!-- Size và Màu - cùng hàng -->
          <div style="display: flex; width: 100%; margin-bottom: 2mm; gap: 1mm;">
            <div style="text-align: center; flex: 1; border: 1px solid #ddd; padding: 1mm; border-radius: 2px;">
              <div style="font-weight: bold; font-size: 7px; color: #666;">SIZE</div>
              <div style="font-size: 12px; font-weight: bold; color: #000;">${size?.trim() || 'N/A'}</div>
            </div>
            <div style="text-align: center; flex: 1; border: 1px solid #ddd; padding: 1mm; border-radius: 2px;">
              <div style="font-weight: bold; font-size: 7px; color: #666;">MÀU</div>
              <div style="font-size: 6px; line-height: 1.1; font-weight: bold;">${colorName}</div>
            </div>
          </div>
          
          <!-- Giá - TO HỚN -->
          <div style="text-align: center; margin-bottom: 3mm; width: 100%; background: #f8f9fa; border: 2px solid #e74c3c; border-radius: 3px; padding: 2mm;">
            <div style="font-weight: bold; font-size: 8px; color: #666; margin-bottom: 1mm;">GIÁ BÁN</div>
            <div style="font-size: 16px; font-weight: bold; color: #e74c3c; line-height: 1.1;">
              ${formatPrice(product.gia || 0)}
            </div>
          </div>
          
          <!-- Chất liệu -->
          <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
            <div style="font-weight: bold; font-size: 7px; color: #666; margin-bottom: 1mm;">CHẤT LIỆU</div>
            <div style="font-size: 8px; line-height: 1.1; color: #333;">
              ${(product.chatLieu || 'N/A').length > 20 ? (product.chatLieu || 'N/A').substring(0, 20) + '...' : (product.chatLieu || 'N/A')}
            </div>
          </div>
          
          <!-- Thương hiệu -->
          <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
            <div style="font-weight: bold; font-size: 7px; color: #666; margin-bottom: 1mm;">THƯƠNG HIỆU</div>
            <div style="font-size: 8px; line-height: 1.1; color: #333;">
              ${(product.thuongHieu || 'N/A').length > 15 ? (product.thuongHieu || 'N/A').substring(0, 15) + '...' : (product.thuongHieu || 'N/A')}
            </div>
          </div>
          
          <!-- Loại sản phẩm -->
          <div style="text-align: center; margin-bottom: 2mm; width: 100%;">
            <div style="font-weight: bold; font-size: 7px; color: #666; margin-bottom: 1mm;">LOẠI</div>
            <div style="font-size: 8px; line-height: 1.1; color: #333;">
              ${(product.loaiSanPham || 'N/A').length > 15 ? (product.loaiSanPham || 'N/A').substring(0, 15) + '...' : (product.loaiSanPham || 'N/A')}
            </div>
          </div>
          
          <!-- QR Code -->
          <div style="text-align: center; margin-top: auto; width: 100%;">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
                `https://fashionhub.name.vn/products/${product.maSanPham}`
              )}&size=120x120"
              alt="QR Code"
              style="width: 18mm; height: 18mm; border: 1px solid #000;"
              onerror="this.style.display='none'"
            />
          </div>
          
          <!-- Ngày in -->
          <div style="text-align: center; font-size: 5px; margin-top: 2mm; border-top: 1px solid #ddd; padding-top: 1mm; width: 100%; color: #666;">
            ${new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
      `;
    };

    // Group products into pages (6 cards per page: 3 columns x 2 rows)
    const cardsPerPage = 6;
    const pages = [];
    for (let i = 0; i < allProductsData.length; i += cardsPerPage) {
      const pageProducts = allProductsData.slice(i, i + cardsPerPage);
      pages.push(pageProducts);
    }

    // Generate HTML content with pages
    const pagesHtml = pages.map((pageProducts, pageIndex) => {
      const cardsHtml = pageProducts.map(createCompactProductCard).join('');
      
      return `
        <div class="page" style="
          width: 210mm;
          min-height: 297mm;
          background: white;
          margin: 0 auto;
          padding: 3mm;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: repeat(2, 1fr);
          gap: 2mm;
          box-sizing: border-box;
          ${pageIndex < pages.length - 1 ? 'page-break-after: always;' : ''}
        ">
          ${cardsHtml}
        </div>
      `;
    }).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>In danh sách sản phẩm - ${allProductsData.length} sản phẩm</title>
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background: #f5f5f5;
          }
          .container {
            width: 100%;
            margin: 0;
          }
          .page {
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
          }
          .compact-card {
            break-inside: avoid;
          }
          .no-print {
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            background: white;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            border-radius: 5px;
          }
          .btn {
            background-color: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            margin: 0 5px;
            transition: background-color 0.3s;
          }
          .btn:hover {
            background-color: #0056b3;
          }
          .btn-secondary {
            background-color: #6c757d;
          }
          .btn-secondary:hover {
            background-color: #545b62;
          }
          .stats {
            display: inline-block;
            background: #e8f4fd;
            padding: 8px 16px;
            border-radius: 20px;
            margin: 0 10px;
            font-size: 12px;
            color: #2c5aa0;
            font-weight: bold;
          }
          
          @media print {
            .no-print { 
              display: none !important; 
            }
            body { 
              background: white !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            .page {
              box-shadow: none !important;
              margin: 0 !important;
              page-break-inside: avoid;
              width: 210mm !important;
              height: 297mm !important;
            }
            .compact-card {
              break-inside: avoid;
              page-break-inside: avoid;
            }
          }
          
          @page {
            size: A4;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <h2 style="color: #2c5aa0; margin-bottom: 15px;">
            📋 Preview Thẻ Sản Phẩm
          </h2>
          <div style="margin-bottom: 15px;">
            <span class="stats">📦 ${allProductsData.length} sản phẩm</span>
            <span class="stats">📄 ${pages.length} trang A4</span>
            <span class="stats">🏷️ 6 thẻ/trang</span>
          </div>
          <button onclick="window.print()" class="btn">
            🖨️ In Ngay
          </button>
          <button onclick="window.close()" class="btn btn-secondary">
            ❌ Đóng
          </button>
        </div>
        
        <div class="container">
          ${pagesHtml}
        </div>

        <div class="no-print" style="margin-top: 20px; padding: 20px; background: white; text-align: center; border-radius: 5px;">
          <div style="margin-bottom: 15px; color: #666;">
            <small>⚡ Lưu ý: Đảm bảo chọn khổ giấy A4 và tỷ lệ 100% khi in</small>
          </div>
          <button onclick="window.print()" class="btn">
            🖨️ In Tất Cả
          </button>
          <button onclick="window.close()" class="btn btn-secondary">
            ❌ Đóng Cửa Sổ
          </button>
        </div>

        <script>
          // Function to generate CODE128 barcode
          function generateCode128Barcode(canvas, text, options) {
            if (!canvas || !text) return;
            
            const CODE128 = {
              B: {
                ' ': 0, '!': 1, '"': 2, '#': 3, '$': 4, '%': 5, '&': 6, "'": 7, '(': 8, ')': 9,
                '*': 10, '+': 11, ',': 12, '-': 13, '.': 14, '/': 15, '0': 16, '1': 17, '2': 18, '3': 19,
                '4': 20, '5': 21, '6': 22, '7': 23, '8': 24, '9': 25, ':': 26, ';': 27, '<': 28, '=': 29,
                '>': 30, '?': 31, '@': 32, 'A': 33, 'B': 34, 'C': 35, 'D': 36, 'E': 37, 'F': 38, 'G': 39,
                'H': 40, 'I': 41, 'J': 42, 'K': 43, 'L': 44, 'M': 45, 'N': 46, 'O': 47, 'P': 48, 'Q': 49,
                'R': 50, 'S': 51, 'T': 52, 'U': 53, 'V': 54, 'W': 55, 'X': 56, 'Y': 57, 'Z': 58, '[': 59,
                '\\\\': 60, ']': 61, '^': 62, '_': 63, '\`': 64, 'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69,
                'f': 70, 'g': 71, 'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79,
                'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87, 'x': 88, 'y': 89,
                'z': 90, '{': 91, '|': 92, '}': 93, '~': 94, 'FNC3': 95, 'FNC2': 96, 'SHIFT': 97, 'CODEC': 98,
                'FNC4': 99, 'FNC1': 100, 'STARTB': 104, 'STOP': 106,
              },
              PATTERNS: [
                '11011001100', '11001101100', '11001100110', '10010011000', '10010001100', '10001001100',
                '10011001000', '10011000100', '10001100100', '11001001000', '11001000100', '11000100100',
                '10110011100', '10011011100', '10011001110', '10111001100', '10011101100', '10011100110',
                '11001110010', '11001011100', '11001001110', '11011100100', '11001110100', '11101101110',
                '11101001100', '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
                '11011011000', '11011000110', '11000110110', '10100011000', '10001011000', '10001001110',
                '10110001000', '10001101000', '10001100110', '11010001000', '11000101000', '11000100110',
                '10110111000', '10110001110', '10001101110', '10111011000', '10111000110', '10001110110',
                '11101110110', '11010001110', '11000101110', '11011101000', '11011100110', '11011100010',
                '11011011100', '11011001110', '11011000110', '11000110110', '11100010110', '11100010011',
                '11101011000', '11101000110', '11100101110', '11101101000', '11101100110', '11101100010',
                '11100111100', '11100110011', '11101111000', '11000010100', '10000101100', '10000100110',
                '10110010000', '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
                '11000010010', '10001001010', '10111010000', '10111000010', '10001010100', '10001010010',
                '11110111010', '11000001110', '11110001010', '10100111000', '10100001100', '10010111000',
                '10010001110', '10000101110', '10000100111', '10111100100', '10111100010', '10110011110',
                '10011110110', '10011110011', '11110100100', '11110100010', '11110010100', '11110010010',
                '11011010110', '11010110110', '11010110011', '11010010111', '11010010011', '11010000111',
              ],
            };

            const sanitizedText = text.replace(/[^A-Za-z0-9_]/g, '').slice(0, 20);
            
            let sum = 104;
            let checksum = sum;
            const chars = ['STARTB'];

            for (let i = 0; i < sanitizedText.length; i++) {
              const char = sanitizedText[i];
              const value = CODE128.B[char] ?? 0;
              chars.push(char);
              sum += value * (i + 1);
              checksum = sum % 103;
            }

            chars.push(Object.keys(CODE128.B)[checksum % 94]);
            chars.push('STOP');

            let pattern = '';
            for (const char of chars) {
              const value = CODE128.B[char];
              if (value !== undefined) {
                pattern += CODE128.PATTERNS[value];
              }
            }

            const ctx = canvas.getContext('2d');
            canvas.width = options.width;
            canvas.height = options.height;
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const barCount = pattern.length;
            const barWidth = canvas.width / barCount;

            ctx.imageSmoothingEnabled = false;
            ctx.fillStyle = '#000000';
            for (let i = 0; i < pattern.length; i++) {
              if (pattern[i] === '1') {
                ctx.fillRect(i * barWidth, 0, Math.ceil(barWidth), canvas.height);
              }
            }
          }

          // Generate barcodes after page loads
          window.addEventListener('load', function() {
            // Wait for images to load first
            setTimeout(function() {
              ${allProductsData.map((product) => `
                const canvas_${product.maSanPham.replace(/[^a-zA-Z0-9]/g, '_')} = document.getElementById('barcode-canvas-${product.maSanPham}');
                if (canvas_${product.maSanPham.replace(/[^a-zA-Z0-9]/g, '_')}) {
                  generateCode128Barcode(canvas_${product.maSanPham.replace(/[^a-zA-Z0-9]/g, '_')}, '${product.maSanPham}', { width: 180, height: 25 });
                }
              `).join('\n')}
              
              // Focus window for better user experience
              window.focus();
            }, 1000);
          });

          // Keyboard shortcut for printing
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'p') {
              e.preventDefault();
              window.print();
            }
          });
        </script>
      </body>
      </html>
    `;

    // Mở cửa sổ mới để in
    const newWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    if (!newWindow) {
      throw new Error('Không thể mở cửa sổ mới. Vui lòng kiểm tra popup blocker.');
    }
    
    newWindow.document.write(htmlContent);
    newWindow.document.close();

    Swal.fire({
      title: '🎉 Thành công!',
      html: `
        <div style="text-align: left; margin-top: 10px;">
          ✅ <strong>${allProductsData.length}</strong> sản phẩm<br>
          📄 <strong>${pages.length}</strong> trang A4<br>
          🏷️ <strong>6</strong> thẻ mỗi trang<br>
          ⏰ Sẵn sàng để in!
        </div>
      `,
      icon: 'success',
      timer: 4000,
      timerProgressBar: true,
      showConfirmButton: false,
    });

  } catch (error) {
    console.error('Lỗi khi tạo trang in:', error);
    Swal.fire({
      title: 'Lỗi',
      text: `Không thể tạo trang in: ${(error as Error).message}`,
      icon: 'error',
    });
  }
};

// Function to preview product cards with A6 size in single row using MagnifierComponent
export const previewProductCards = async (selectedProducts: Set<string>) => {
  if (selectedProducts.size === 0) {
    Swal.fire({
      title: 'Thông báo',
      text: 'Vui lòng chọn ít nhất một sản phẩm để xem preview.',
      icon: 'warning',
    });
    return;
  }

  try {
    const allProductsData: Product[] = [];
    for (const productId of selectedProducts) {
      try {
        const response = await fetch(`https://bicacuatho.azurewebsites.net/api/SanPham/SanPhamByID?id=${productId}`);
        if (!response.ok) {
          throw new Error(`Không thể lấy dữ liệu cho sản phẩm ${productId}`);
        }
        const data = await response.json();
        allProductsData.push(...data);
      } catch (error) {
        console.error(`Lỗi khi fetch sản phẩm ${productId}:`, error);
      }
    }

    if (allProductsData.length === 0) {
      Swal.fire({
        title: 'Lỗi',
        text: 'Không thể lấy dữ liệu sản phẩm từ API.',
        icon: 'error',
      });
      return;
    }

    // Create a container for React rendering
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Render React component with MagnifierComponent
    const renderPreview = async () => {
      ReactDOM.render(
        <div style={{ maxWidth: '90vw', overflowX: 'auto', padding: '0' }}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
            {allProductsData.map((product) => (
              <MagnifierComponent
                key={product.maSanPham}
                magnifierSize={300} // 8cm
                zoomLevel={2}
                sourceSize={150} // 4cm
              >
                <div dangerouslySetInnerHTML={{ __html: createSmallPreviewCard(product) }} />
              </MagnifierComponent>
            ))}
          </div>
        </div>,
        container
      );

      // Generate barcodes after rendering
      allProductsData.forEach((product) => {
        const canvasSmall = document.getElementById(`barcode-canvas-small-${product.maSanPham}`) as HTMLCanvasElement;
        if (canvasSmall) {
          generateCode128Barcode(canvasSmall, product.maSanPham, {
            width: 150,
            height: 25,
          });
        }
      });
    };

    await renderPreview();

    Swal.fire({
      title: `Preview ${allProductsData.length} thẻ sản phẩm`,
      html: container,
      width: '90%',
      showCancelButton: true,
      confirmButtonText: 'In PDF',
      cancelButtonText: 'Đóng',
      confirmButtonColor: '#000000',
      didClose: () => {
        // Clean up
        ReactDOM.unmountComponentAtNode(container);
        document.body.removeChild(container);
      },
    }).then((result) => {
      if (result.isConfirmed) {
        printToPDF(selectedProducts);
      }
    });

  } catch (error) {
    console.error('Lỗi khi preview:', error);
    Swal.fire({
      title: 'Lỗi',
      text: `Không thể xem preview: ${(error as Error).message}`,
      icon: 'error',
    });
  }
};