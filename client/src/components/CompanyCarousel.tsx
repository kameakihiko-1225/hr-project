import { useTranslation } from "react-i18next";
import { useState } from "react";
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
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isPaused, setIsPaused] = useState(false);
  
  if (LOGO_FILES.length === 0) return null;
  
  // Triple the logos for seamless infinite scroll
  const logos = [...LOGO_FILES, ...LOGO_FILES, ...LOGO_FILES];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          {t('company_logos_title')}
        </h2>
        <div className="relative overflow-hidden">
          <div
            className={`flex space-x-4 sm:space-x-6 md:space-x-8 ${isPaused ? '' : 'animate-scroll'} scrollbar-hide`}
            style={{ 
              height: isMobile ? '140px' : '200px',
              overflowX: 'auto'
            }}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setTimeout(() => setIsPaused(false), 1000)}
            onScroll={(e) => {
              // Allow manual scrolling to temporarily pause auto-scroll
              setIsPaused(true);
              clearTimeout((window as any).scrollResetTimer);
              (window as any).scrollResetTimer = setTimeout(() => setIsPaused(false), 3000);
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
      {/* Custom styles for smooth carousel animation */}
      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        .animate-scroll {
          animation: scroll 15s linear infinite;
        }
        
        /* Pause animation on hover for better user experience */
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};
