import { useTranslation } from "react-i18next";
import { useEffect, useRef } from "react";

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
  if (LOGO_FILES.length === 0) return null;
  const logos = [...LOGO_FILES, ...LOGO_FILES]; // duplicate for seamless scroll

  // auto-scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const startAutoScroll = () => {
      intervalRef.current = window.setInterval(() => {
        if (!container) return;
        container.scrollLeft += 1.5;
        // reset for infinite scroll illusion
        if (container.scrollLeft >= container.scrollWidth / 2) {
          container.scrollLeft = 0;
        }
      }, 30);
    };

    startAutoScroll();

    // pause on hover
    const handleEnter = () => {
      if (intervalRef.current !== undefined) window.clearInterval(intervalRef.current);
    };
    const handleLeave = () => startAutoScroll();

    container.addEventListener("mouseenter", handleEnter);
    container.addEventListener("mouseleave", handleLeave);

    return () => {
      if (intervalRef.current !== undefined) window.clearInterval(intervalRef.current);
      container.removeEventListener("mouseenter", handleEnter);
      container.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          {t('company_logos_title')}
        </h2>
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex space-x-8 overflow-x-auto scrollbar-hide pb-4"
            style={{ 
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              height: '200px'
            }}
          >
            {logos.map((file, idx) => (
              <div
                key={`${file}-${idx}`}
                className="flex-shrink-0 bg-white rounded-2xl shadow-md ring-1 ring-gray-200 flex items-center justify-center p-6 transition-transform hover:shadow-xl hover:-translate-y-1"
                style={{ 
                  width: '200px', 
                  height: '160px',
                  minWidth: '200px',
                  minHeight: '160px'
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/companies/${file}`}
                  alt={`${file.split('.')[0]} logo`}
                  className="max-h-24 max-w-full object-contain"
                  style={{
                    width: 'auto',
                    height: 'auto',
                    maxWidth: '100%',
                    maxHeight: '96px'
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
