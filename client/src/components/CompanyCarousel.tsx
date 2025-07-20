import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

// List of logos stored in public/companies. Add/remove files there and update list below.
const LOGO_FILES = [
  "idp_ielts_logo.svg",
  "logo-light.png",
  "mu-logo.png",
  "school.png",
  "khan_academy_logo.png"
];

export const CompanyCarousel = () => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const intervalRef = useRef<number | undefined>();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  
  if (LOGO_FILES.length === 0) return null;
  const logos = [...LOGO_FILES, ...LOGO_FILES]; // duplicate for seamless scroll

  // auto-scroll with enhanced mobile support
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Enhanced scrolling speed for mobile
    const scrollSpeed = isMobile ? 2.5 : 1.5;
    const scrollInterval = isMobile ? 20 : 30;

    const startAutoScroll = () => {
      intervalRef.current = window.setInterval(() => {
        if (!container || isUserInteracting) return;
        container.scrollLeft += scrollSpeed;
        // reset for infinite scroll illusion
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }, scrollInterval);
    };

    startAutoScroll();

    // Enhanced interaction handling for mobile
    const handleInteractionStart = () => {
      setIsUserInteracting(true);
      if (intervalRef.current !== undefined) window.clearInterval(intervalRef.current);
    };
    
    const handleInteractionEnd = () => {
      setIsUserInteracting(false);
      setTimeout(() => {
        if (!isUserInteracting) startAutoScroll();
      }, 2000); // Resume after 2 seconds of no interaction
    };

    // Desktop mouse events
    container.addEventListener("mouseenter", handleInteractionStart);
    container.addEventListener("mouseleave", handleInteractionEnd);
    
    // Mobile touch events
    container.addEventListener("touchstart", handleInteractionStart);
    container.addEventListener("touchend", handleInteractionEnd);
    container.addEventListener("touchcancel", handleInteractionEnd);

    return () => {
      if (intervalRef.current !== undefined) window.clearInterval(intervalRef.current);
      container.removeEventListener("mouseenter", handleInteractionStart);
      container.removeEventListener("mouseleave", handleInteractionEnd);
      container.removeEventListener("touchstart", handleInteractionStart);
      container.removeEventListener("touchend", handleInteractionEnd);
      container.removeEventListener("touchcancel", handleInteractionEnd);
    };
  }, [isMobile, isUserInteracting]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          {t('company_logos_title')}
        </h2>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex space-x-4 sm:space-x-6 md:space-x-8 overflow-x-auto scrollbar-hide pb-4"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              height: isMobile ? '140px' : '200px'
            }}
          >
            {logos.map((file, idx) => (
              <div
                key={`${file}-${idx}`}
                className="flex-shrink-0 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md ring-1 ring-gray-200 flex items-center justify-center p-3 sm:p-4 md:p-6 transition-transform hover:shadow-xl hover:-translate-y-1"
                style={{ 
                  width: isMobile ? '120px' : '200px', 
                  height: isMobile ? '100px' : '160px',
                  minWidth: isMobile ? '120px' : '200px',
                  minHeight: isMobile ? '100px' : '160px'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/companies/${file}`}
                  alt={`${file.split('.')[0]} logo`}
                  className="max-w-full object-contain"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: isMobile ? '60px' : '96px'
                  }}
                  onError={(e) => {
                    console.error(`Failed to load image: /companies/${file}`);
                    e.currentTarget.style.border = '2px solid red';
                    e.currentTarget.alt = `Failed to load: ${file}`;
                  }}
                  onLoad={() => console.log(`Successfully loaded: /companies/${file}`)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Custom styles for carousel */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation-name: scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
      `}</style>
    </section>
  );
};
