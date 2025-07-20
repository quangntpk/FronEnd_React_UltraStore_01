import { useState, useRef } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

const MagnifierComponent = ({ children, magnifierSize = 227, zoomLevel = 3, imageSrc }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [backgroundPosition, setBackgroundPosition] = useState('0px 0px');
    const containerRef = useRef(null);
    const magnifierRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!containerRef.current || !magnifierRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
            setIsVisible(false);
            return;
        }

        let magnifierX = x + 20;
        let magnifierY = y - magnifierSize - 20;

        const viewportWidth = window.innerWidth;
        const absoluteX = e.clientX + 20;
        const absoluteY = e.clientY - magnifierSize - 20;

        if (absoluteX + magnifierSize > viewportWidth) {
            magnifierX = x - magnifierSize - 20;
        }
        if (absoluteY < 0) {
            magnifierY = y + 20;
        }

        setPosition({ x: magnifierX, y: magnifierY });

        const backgroundX = -(x * zoomLevel - magnifierSize / 2);
        const backgroundY = -(y * zoomLevel - magnifierSize / 2);
        setBackgroundPosition(`${backgroundX}px ${backgroundY}px`);
    };

    const handleMouseEnter = () => {
        setIsVisible(true);
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <div
            ref={containerRef}
            className="magnifier-container"
            style={{ position: 'relative', display: 'inline-block', overflow: 'visible' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {isVisible && (
                <div
                    ref={magnifierRef}
                    className="magnifier-glass"
                    style={{
                        position: 'absolute',
                        width: `${magnifierSize}px`,
                        height: `${magnifierSize}px`,
                        border: '3px solid #000',
                        backgroundColor: '#fff',
                        boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                        pointerEvents: 'none',
                        zIndex: 1000,
                        left: `${position.x}px`,
                        top: `${position.y}px`,
                        backgroundImage: `url(${imageSrc})`,
                        backgroundSize: `${containerRef.current?.offsetWidth * zoomLevel}px ${containerRef.current?.offsetHeight * zoomLevel}px`,
                        backgroundPosition: backgroundPosition,
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            )}
        </div>
    );
};

const MoTaSanPham = ({ product }) => {
    const [activeTitles, setActiveTitles] = useState(new Set());
    const [mainImageIndex, setMainImageIndex] = useState(0);
    const mainImageRef = useRef(null);

    const toggleTitle = (index) => {
        const newActiveTitles = new Set(activeTitles);
        if (newActiveTitles.has(index)) {
            newActiveTitles.delete(index);
        } else {
            newActiveTitles.add(index);
        }
        setActiveTitles(newActiveTitles);
    };

    const handleSliderImageClick = (index) => {
        setMainImageIndex(index + 1);
    };

    const handleMainImageClick = () => {
        if (product?.moTaChiTiet?.picture?.[mainImageIndex]?.url) {
            const imageSrc = `data:image/jpeg;base64,${product.moTaChiTiet.picture[mainImageIndex].url}`;
            const fullImageWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
            if (!fullImageWindow) {
                alert('Không thể mở cửa sổ ảnh. Vui lòng kiểm tra popup blocker!');
                return;
            }
            const fullImageHtml = `
                <!DOCTYPE html>
                <html lang="vi">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Ảnh Sản Phẩm Toàn Kích Thước</title>
                    <style>
                        body { margin: 0; padding: 0; background-color: #f1f1f1; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                        img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                    </style>
                </head>
                <body>
                    <img src="${imageSrc}" alt="Full Size Product Image" />
                </body>
                </html>
            `;
            fullImageWindow.document.write(fullImageHtml);
            fullImageWindow.document.close();
            fullImageWindow.focus();
        }
    };

    if (!product?.moTaChiTiet) {
        return <div className="text-gray-600 p-4">Không có mô tả chi tiết.</div>;
    }

    return (
        <div className="p-4 lg:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-8 transition-all duration-300">
                    <div className="text-center">
                        <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium mb-4">
                            Mô Tả Chi Tiết Của Sản Phẩm
                        </div>
                        {product?.tenSanPham && (
                            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                                {product.tenSanPham}
                            </h1>
                        )}
                        {product?.moTaChiTiet?.moTa?.header?.title && (
                            <h2 className="text-xl lg:text-2xl font-semibold text-gray-700 mb-4">
                                {product.moTaChiTiet.moTa.header.title}
                            </h2>
                        )}
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 order-2 lg:order-1 transition-all duration-300">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                            <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm mr-3">📸</span>
                            Hình ảnh sản phẩm
                        </h2>
                        {product.moTaChiTiet.moTa?.picture?.[mainImageIndex]?.url ? (
                            <MagnifierComponent
                                magnifierSize={227}
                                zoomLevel={3}
                                imageSrc={`data:image/jpeg;base64,${product.moTaChiTiet.moTa?.picture[mainImageIndex].url}`}
                            >
                                <img
                                    ref={mainImageRef}
                                    src={`data:image/jpeg;base64,${product.moTaChiTiet.moTa?.picture[mainImageIndex].url}`}
                                    alt="Main Image"
                                    className="w-full max-w-md mx-auto rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer"
                                    onClick={handleMainImageClick}
                                />
                            </MagnifierComponent>
                        ) : (
                            <div className="text-gray-600 text-center">Không có ảnh sản phẩm.</div>
                        )}
                        {product.moTaChiTiet.moTa.picture?.slice(1).length > 0 && (
                            <div className="bg-gray-50 rounded-2xl p-4 mt-6">
                                <h3 className="text-lg font-semibold mb-4 text-gray-700">🖼️ Thư viện ảnh</h3>
                                <Swiper
                                    slidesPerView={1}
                                    spaceBetween={16}
                                    breakpoints={{
                                        640: { slidesPerView: 2 },
                                        1024: { slidesPerView: 3 },
                                    }}
                                    pagination={{ el: '.swiper-pagination', clickable: true }}
                                    navigation={{
                                        nextEl: '.swiper-button-next',
                                        prevEl: '.swiper-button-prev',
                                    }}
                                    autoplay={{ delay: 3000, disableOnInteraction: false }}
                                    loop={product.moTaChiTiet.moTa.picture.length > 1}
                                    modules={[Navigation, Pagination, Autoplay]}
                                    className="swiper"
                                >
                                    {product.moTaChiTiet.moTa.picture.slice(1).map((picture, index) => (
                                        picture.url && (
                                            <SwiperSlide key={index}>
                                                <img
                                                    src={`data:image/jpeg;base64,${picture.url}`}
                                                    alt={`Gallery Image ${index + 1}`}
                                                    className="w-full h-48 object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                                    onClick={() => handleSliderImageClick(index)}
                                                />
                                            </SwiperSlide>
                                        )
                                    ))}
                                    <div className="swiper-pagination mt-4"></div>
                                    <div className="swiper-button-prev"></div>
                                    <div className="swiper-button-next"></div>
                                </Swiper>
                            </div>
                        )}
                    </div>
                    <div className="space-y-6 order-1 lg:order-2">
                        <div className="bg-white rounded-2xl shadow-xl p-6 transition-all duration-300">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm mr-3">ℹ️</span>
                                Mô Tả Chi Tiết
                            </h2>
                            <div className="space-y-4">
                                {product.moTaChiTiet.moTa.title?.map((title, titleIndex) => (
                                    <div key={titleIndex} className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300">
                                        {title.name && (
                                            <div
                                                className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100"
                                                onClick={() => toggleTitle(titleIndex)}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                                                        <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm mr-3">
                                                            {titleIndex + 1}
                                                        </span>
                                                        {title.name}
                                                    </h3>
                                                    <div className={`arrow-rotate ${activeTitles.has(titleIndex) ? 'rotated' : ''}`}>
                                                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className={`title-content ${activeTitles.has(titleIndex) ? 'active' : ''}`}>
                                            <div className="p-6 pt-0">
                                                {title.subtitle?.map((subtitle, subtitleIndex) => (
                                                    <div key={subtitleIndex} className="mb-6 last:mb-0">
                                                        {subtitle.name && (
                                                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-3">
                                                                <h4 className="text-lg font-semibold text-gray-700 flex items-center">
                                                                    <span className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs mr-2">
                                                                        ✓
                                                                    </span>
                                                                    {subtitle.name}
                                                                </h4>
                                                            </div>
                                                        )}
                                                        {subtitle.description?.content && (
                                                            <div
                                                                className="text-gray-600 prose max-w-none pl-8 leading-relaxed"
                                                                dangerouslySetInnerHTML={{ __html: subtitle.description.content }}
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            <style>{`
                .magnifier-container {
                    position: relative;
                    display: inline-block;
                    overflow: visible;
                }
                
                .magnifier-glass {
                    position: absolute;
                    width: 227px;
                    height: 227px;
                    border: 3px solid #000;
                    background-color: #fff;
                    box-shadow: 0 0 10px rgba(0,0,0,0.5);
                    pointer-events: none;
                    z-index: 1000;
                }
                
                ::-webkit-scrollbar {
                    width: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #888;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
                
                .title-content {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease-out;
                }
                
                .title-content.active {
                    max-height: 1000px;
                    transition: max-height 0.5s ease-in;
                }
                
                .swiper-button-next,
                .swiper-button-prev {
                    color: #3b82f6;
                    background: white;
                    border-radius: 50%;
                    width: 44px;
                    height: 44px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                .swiper-button-next::after,
                .swiper-button-prev::after {
                    font-size: 18px;
                    font-weight: bold;
                }
                
                .swiper-pagination-bullet {
                    background: #3b82f6;
                    opacity: 0.7;
                }
                
                .swiper-pagination-bullet-active {
                    opacity: 1;
                }
                
                .arrow-rotate {
                    transition: transform 0.3s ease;
                }
                
                .arrow-rotate.rotated {
                    transform: rotate(180deg);
                }
            `}</style>
        </div>
    );
};

export default MoTaSanPham;