import { useState, useEffect, useRef } from 'react';

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

        // Ensure the cursor stays within the image bounds
        if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
            setIsVisible(false);
            return;
        }

        let magnifierX = x + 20;
        let magnifierY = y - magnifierSize - 20;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const absoluteX = e.clientX + 20;
        const absoluteY = e.clientY - magnifierSize - 20;

        if (absoluteX + magnifierSize > viewportWidth) {
            magnifierX = x - magnifierSize - 20;
        }
        if (absoluteY < 0) {
            magnifierY = y + 20;
        }

        setPosition({ x: magnifierX, y: magnifierY });

        // Calculate background position for magnification directly from the original image
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

const PreviewDes = ({ formData }) => {
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
        if (formData.MoTa.Picture[mainImageIndex]?.url) {
            const imageSrc = `data:image/jpeg;base64,${formData.MoTa.Picture[mainImageIndex].url}`;
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
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: #f1f1f1;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                    }
                    img {
                        max-width: 100%;
                        max-height: 100vh;
                        object-fit: contain;
                    }
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

    const handleSubmit = async () => {
        try {
            const previewWindow = window.open('', '_blank', 'width=1400,height=900,scrollbars=yes,resizable=yes');

            if (!previewWindow) {
                alert('Không thể mở cửa sổ preview. Vui lòng kiểm tra popup blocker!');
                return;
            }

            const htmlContent = `
            <!DOCTYPE html>
            <html lang="vi">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Xem Trước Mô Tả Sản Phẩm</title>
                <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
                <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
                <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                <script src="https://unpkg.com/swiper@8/swiper-bundle.min.js"></script>
                <link href="https://unpkg.com/swiper@8/swiper-bundle.min.css" rel="stylesheet"/>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
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
                    
                    .card-hover:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    }
                    
                    .arrow-rotate {
                        transition: transform 0.3s ease;
                    }
                    
                    .arrow-rotate.rotated {
                        transform: rotate(180deg);
                    }
                    
                    .loading {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        background: #fff;
                    }
                    
                    .loading-spinner {
                        width: 50px;
                        height: 50px;
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3b82f6;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                    
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }

                    .main-image {
                        cursor: pointer;
                    }
                </style>
            </head>
            <body class="min-h-screen">
                <div id="loading" class="loading">
                    <div className="loading-spinner"></div>
                </div>
                <div id="root" style="display: none;"></div>
                <script type="text/babel">
                    const { useState, useEffect, useRef } = React;

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
                            const viewportHeight = window.innerHeight;
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
                            setBackgroundPosition(\`\${backgroundX}px \${backgroundY}px\`);
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
                                            width: \`\${magnifierSize}px\`,
                                            height: \`\${magnifierSize}px\`,
                                            border: '3px solid #000',
                                            backgroundColor: '#fff',
                                            boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                                            pointerEvents: 'none',
                                            zIndex: 1000,
                                            left: \`\${position.x}px\`,
                                            top: \`\${position.y}px\`,
                                            backgroundImage: \`url(\${imageSrc})\`,
                                            backgroundSize: \`\${containerRef.current?.offsetWidth * zoomLevel}px \${containerRef.current?.offsetHeight * zoomLevel}px\`,
                                            backgroundPosition: backgroundPosition,
                                            backgroundRepeat: 'no-repeat',
                                        }}
                                    />
                                )}
                            </div>
                        );
                    };

                    const formData = ${JSON.stringify(formData)};

                    const PreviewDes = ({ formData }) => {
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
                            if (formData.MoTa.Picture[mainImageIndex]?.url) {
                                const imageSrc = \`data:image/jpeg;base64,\${formData.MoTa.Picture[mainImageIndex].url}\`;
                                const fullImageWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
                                
                                if (!fullImageWindow) {
                                    alert('Không thể mở cửa sổ ảnh. Vui lòng kiểm tra popup blocker!');
                                    return;
                                }

                                const fullImageHtml = \`
                                <!DOCTYPE html>
                                <html lang="vi">
                                <head>
                                    <meta charset="UTF-8">
                                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                    <title>Ảnh Sản Phẩm Toàn Kích Thước</title>
                                    <style>
                                        body {
                                            margin: 0;
                                            padding: 0;
                                            background-color: #f1f1f1;
                                            display: flex;
                                            justify-content: center;
                                            align-items: center;
                                            min-height: 100vh;
                                        }
                                        img {
                                            max-width: 100%;
                                            max-height: 100vh;
                                            object-fit: contain;
                                        }
                                    </style>
                                </head>
                                <body>
                                    <img src="\${imageSrc}" alt="Full Size Product Image" />
                                </body>
                                </html>
                                \`;

                                fullImageWindow.document.write(fullImageHtml);
                                fullImageWindow.document.close();
                                fullImageWindow.focus();
                            }
                        };

                        useEffect(() => {
                            setTimeout(() => {
                                document.getElementById('loading').style.display = 'none';
                                document.getElementById('root').style.display = 'block';
                            }, 1000);

                            const swiper = new Swiper('.swiper', {
                                slidesPerView: 1,
                                spaceBetween: 16,
                                breakpoints: {
                                    640: {
                                        slidesPerView: 2,
                                    },
                                    1024: {
                                        slidesPerView: 3,
                                    },
                                },
                                pagination: {
                                    el: '.swiper-pagination',
                                    clickable: true,
                                },
                                navigation: {
                                    nextEl: '.swiper-button-next',
                                    prevEl: '.swiper-button-prev',
                                },
                                autoplay: {
                                    delay: 3000,
                                    disableOnInteraction: false,
                                },
                                loop: formData.MoTa.Picture.length > 1,
                            });

                            return () => {
                                if (swiper) {
                                    swiper.destroy(true, true);
                                }
                            };
                        }, []);

                        return (
                            <div className="min-h-screen p-4 lg:p-8">
                                <div className="max-w-6xl mx-auto">
                                    <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-8 card-hover transition-all duration-300">
                                        <div className="text-center">
                                            <div className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium mb-4">
                                                Mô Tả Chi Tiết Của Sản Phẩm
                                            </div>
                                            {formData.MoTa.Header.title && (
                                                <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">
                                                    {formData.MoTa.Header.title}
                                                </h1>
                                            )}
                                            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 card-hover transition-all duration-300">
                                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                                                <span className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm mr-3">📸</span>
                                                Hình ảnh sản phẩm
                                            </h2>
                                            
                                            {formData.MoTa.Picture[mainImageIndex]?.url && (
                                                <MagnifierComponent 
                                                    magnifierSize={227} 
                                                    zoomLevel={3} 
                                                    imageSrc={\`data:image/jpeg;base64,\${formData.MoTa.Picture[mainImageIndex].url}\`}
                                                >
                                                    <img 
                                                        ref={mainImageRef}
                                                        src={\`data:image/jpeg;base64,\${formData.MoTa.Picture[mainImageIndex].url}\`}
                                                        alt="Main Image"
                                                        className="w-full max-w-md mx-auto rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 main-image"
                                                        onClick={handleMainImageClick}
                                                    />
                                                </MagnifierComponent>
                                            )}

                                            {formData.MoTa.Picture.slice(1).length > 0 && (
                                                <div className="bg-gray-50 rounded-2xl p-4">
                                                    <h3 className="text-lg font-semibold mb-4 text-gray-700">🖼️ Thư viện ảnh</h3>
                                                    <div className="swiper">
                                                        <div className="swiper-wrapper">
                                                            {formData.MoTa.Picture.slice(1).map((pic, index) => (
                                                                pic.url && (
                                                                    <div key={index} className="swiper-slide">
                                                                        <img 
                                                                            src={\`data:image/jpeg;base64,\${pic.url}\`}
                                                                            alt={\`Gallery Image \${index + 1}\`}
                                                                            className="w-full h-48 object-cover rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                                                            onClick={() => handleSliderImageClick(index)}
                                                                        />
                                                                    </div>
                                                                )
                                                            ))}
                                                        </div>
                                                        <div className="swiper-pagination mt-4"></div>
                                                        <div className="swiper-button-prev"></div>
                                                        <div className="swiper-button-next"></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-6">
                                            {formData.MoTa.Title.map((title, titleIndex) => (
                                                <div key={titleIndex} className="bg-white rounded-2xl shadow-xl overflow-hidden card-hover transition-all duration-300">
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
                                                                <div className={\`arrow-rotate \${activeTitles.has(titleIndex) ? 'rotated' : ''}\`}>
                                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className={\`title-content \${activeTitles.has(titleIndex) ? 'active' : ''}\`}>
                                                        <div className="p-6 pt-0">
                                                            {title.Subtitle.map((subtitle, subtitleIndex) => (
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
                                                                    {subtitle.Description.content && (
                                                                        <div 
                                                                            className="text-gray-600 prose max-w-none pl-8 leading-relaxed"
                                                                            dangerouslySetInnerHTML={{ __html: subtitle.Description.content }}
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
                        );
                    };

                    const App = () => (
                        <PreviewDes formData={formData} />
                    );

                    const rootElement = document.getElementById('root');
                    ReactDOM.render(<App />, rootElement);
                </script>
            </body>
            </html>
            `;

            previewWindow.document.write(htmlContent);
            previewWindow.document.close();

            previewWindow.focus();

            console.log('Preview window opened successfully');

        } catch (error) {
            console.error('Error opening preview window:', error);
            alert('Có lỗi xảy ra khi mở preview. Vui lòng thử lại!');
        }
    };

    return (
        <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2"
        >
            Preview Mô Tả của Sản phẩm
        </button>
    );
};

export default PreviewDes;