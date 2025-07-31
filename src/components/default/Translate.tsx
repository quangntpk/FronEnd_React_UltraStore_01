import { useEffect } from "react";

declare global {
  interface Window {
    google?: {
      translate?: {
        TranslateElement: new (
          options: {
            pageLanguage: string;
            autoDisplay?: boolean;
            layout?: number;
          },
          containerId: string
        ) => void;
      };
    };
    googleTranslateElementInit?: () => void;
  }
}

const Translate = () => {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "vi",
            autoDisplay: false,
            layout: 1,
          },
          "google_translate_element"
        );
      }
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }

    const hideGoogleTranslateUI = () => {
      const combo = document.querySelector(".goog-te-combo") as HTMLSelectElement;
      if (combo) {
        combo.style.display = "block";
        combo.style.visibility = "visible";
        combo.style.color = "black";
        combo.style.opacity = "1";
        combo.style.fontSize = "16px";
        combo.style.padding = "8px 12px";
        combo.style.borderRadius = "6px";
        combo.style.minWidth = "180px";
        combo.style.backgroundColor = "white";
        combo.style.border = "1px solid #ccc";
        combo.style.cursor = "pointer";
        combo.style.pointerEvents = "auto";
        combo.style.zIndex = "99999";
        combo.style.position = "relative";
      }

      const translateElement = document.getElementById("google_translate_element");
      if (translateElement) {
        translateElement.style.display = "block";
        translateElement.style.visibility = "visible";
        translateElement.style.opacity = "1";
        translateElement.style.position = "relative";
        translateElement.style.zIndex = "99999";
      }

      const gadget = document.querySelector(".goog-te-gadget") as HTMLElement;
      if (gadget) {
        gadget.style.display = "block";
        gadget.style.visibility = "visible";
        gadget.style.opacity = "1";
        gadget.style.position = "relative";
        gadget.style.zIndex = "99999";

        const textNodes = Array.from(gadget.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        textNodes.forEach(textNode => {
          if (textNode.textContent && textNode.textContent.trim()) {
            (textNode as any).style = "display: none";
          }
        });

        
        const spans = gadget.querySelectorAll('span');
        spans.forEach(span => {
          if (!span.querySelector('.goog-te-combo')) {
            span.style.display = "none";
          }
        });
      }

      const translateBody = document.querySelector('body.VIpgJd-ZVi9od-ORHb');
      if (translateBody) {
        translateBody.remove();
      }

      const translateFrames = document.querySelectorAll('iframe[src*="translate.googleapis.com"]');
      const bannerFrame = document.querySelector('iframe.goog-te-banner-frame');
      
      translateFrames.forEach(frame => {
        frame.remove();
        
      });
      
      if (bannerFrame) {
        bannerFrame.remove();
        
      }

      const vipgJdSelectors = [
        '.VIpgJd-ZVi9od-ORHb',
        '.VIpgJd-ZVi9od-ORHb-bN97Pc',
        '.VIpgJd-ZVi9od-LgbsSe',
        '.VIpgJd-ZVi9od-xl07Ob-lTBxed',
        '.VIpgJd-ZVi9od-TvD9Pc-hSRGPd',
        '.VIpgJd-ZVi9od-l4eHX-hSRGPd',
        '.VIpgJd-ZVi9od-ORHb-KE6vqe'
      ];

      vipgJdSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.remove();
          
        });
      });

      const sectionSelectors = [
        '[id$=".finishSection"]',
        '[id$=".progressSection"]',
        '[id$=".promptSection"]',
        '[id$=".errorSection"]'
      ];

      sectionSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.remove();
          
        });
      });

      const otherSelectors = [
        '.goog-logo-link',
        '.goog-te-banner-frame',
        '.goog-te-banner-frame.skiptranslate',
        '#goog-gt-tt',
        '.goog-te-balloon-frame',
        '.goog-te-spinner-pos',
        '.goog-te-ftab-frame',
        '.goog-tooltip',
        '.goog-te-menu-frame'
      ];

      otherSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          el.remove();
        });
      });

      const translateTables = document.querySelectorAll('table[border="0"][cellspacing="0"][cellpadding="0"][height="100%"]');
      translateTables.forEach(table => {
        table.remove();
      });

      const allGoogElements = document.querySelectorAll('[id^="goog-gt"]');
      allGoogElements.forEach(element => {
        if (element.id !== "google_translate_element") {
          element.remove();
        }
      });

      if (document.body) {
        document.body.style.top = "0px";
        document.body.style.position = "static";
        document.body.style.marginTop = "0px";
        document.body.style.transform = "none";
      }

      if (document.documentElement) {
        document.documentElement.style.top = "0px";
        document.documentElement.style.position = "static";
        document.documentElement.style.marginTop = "0px";
        document.documentElement.style.transform = "none";
      }
    };

    const interval = setInterval(hideGoogleTranslateUI, 100);

    const observer = new MutationObserver((mutations) => {
      let shouldHide = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          shouldHide = true;
        }
        if (mutation.type === 'attributes' && 
            (mutation.attributeName === 'class' || mutation.attributeName === 'style')) {
          shouldHide = true;
        }
      });
      
      if (shouldHide) {
        setTimeout(hideGoogleTranslateUI, 10);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return (
    <div>
      <div
        id="google_translate_element"
        style={{
          marginLeft: 1,
          zIndex: 99999,
          position: 'relative',
          display: 'block',
          visibility: 'visible',
          opacity: 1
        }}
      />
      <style>
        {`
          /* Đảm bảo container luôn hiển thị */
          #google_translate_element {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 99999 !important;
          }

          /* Đảm bảo gadget hiển thị */
          .goog-te-gadget {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 99999 !important;
            color: transparent !important;
            font-size: 0 !important;
            line-height: 0 !important;
          }

          /* Style cho combobox - ưu tiên cao nhất */
          .goog-te-combo {
            font-size: 16px !important;
            padding: 8px 12px !important;
            height: auto !important;
            border-radius: 6px !important;
            min-width: 180px !important;
            color: black !important;
            background-color: white !important;
            border: 1px solid #ccc !important;
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            cursor: pointer !important;
            pointer-events: auto !important;
            position: relative !important;
            z-index: 99999 !important;
            top: auto !important;
            left: auto !important;
            width: auto !important;
            margin: 0 !important;
            transform: none !important;
          }

          .goog-te-combo:hover {
            border-color: #999 !important;
          }

          .goog-te-combo:focus {
            outline: none !important;
            border-color: #4285f4 !important;
            box-shadow: 0 0 0 2px rgba(66, 133, 244, 0.2) !important;
          }

          /* Style cho option */
          .goog-te-combo option {
            color: black !important;
            background-color: white !important;
            padding: 5px !important;
            display: block !important;
            visibility: visible !important;
          }

          /* Ẩn span text trong gadget nhưng giữ combobox */
          .goog-te-gadget span:not(:has(.goog-te-combo)) {
            display: none !important;
          }

          /* Ẩn hoàn toàn tất cả UI Google Translate không mong muốn */
          .goog-logo-link,
          #goog-gt-tt,
          .goog-te-balloon-frame,
          .goog-te-banner-frame,
          .goog-te-banner-frame.skiptranslate,
          .goog-te-spinner-pos,
          .goog-te-ftab-frame,
          .goog-tooltip,
          .goog-te-menu-frame,
          .VIpgJd-ZVi9od-ORHb,
          .VIpgJd-ZVi9od-ORHb-bN97Pc,
          .VIpgJd-ZVi9od-LgbsSe,
          .VIpgJd-ZVi9od-xl07Ob-lTBxed,
          .VIpgJd-ZVi9od-TvD9Pc-hSRGPd,
          .VIpgJd-ZVi9od-l4eHX-hSRGPd,
          .VIpgJd-ZVi9od-ORHb-KE6vqe,
          [id$=".finishSection"],
          [id$=".progressSection"],
          [id$=".promptSection"],
          [id$=".errorSection"],
          [id^="goog-gt-"]:not(#google_translate_element),
          table[border="0"][cellspacing="0"][cellpadding="0"][height="100%"],
          iframe.goog-te-banner-frame,
          iframe[src*="translate.googleapis.com"],
          body.VIpgJd-ZVi9od-ORHb {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
            pointer-events: none !important;
          }

          /* Khôi phục vị trí body và html bình thường */
          body, html {
            top: 0px !important;
            position: static !important;
            margin-top: 0px !important;
            transform: none !important;
          }

          /* Đảm bảo không có phần tử nào có thể hiển thị overlay */
          body > iframe[src*="translate.googleapis.com"] {
            display: none !important;
          }

          /* Ẩn tất cả các phần tử có thể xuất hiện sau khi dịch */
          [class*="VIpgJd"]:not(.goog-te-combo):not(#google_translate_element):not(.goog-te-gadget) {
            display: none !important;
          }

          /* Ẩn tất cả goog-te elements trừ combobox */
          [class*="goog-te"]:not(.goog-te-combo):not(.goog-te-gadget):not(#google_translate_element) {
            display: none !important;
          }

          /* Đảm bảo combobox luôn ở trên cùng */
          .goog-te-gadget .goog-te-combo {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
            z-index: 99999 !important;
          }
        `}
      </style>
    </div>
  );
};

export default Translate;