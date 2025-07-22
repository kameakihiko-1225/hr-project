import { useTranslation } from "react-i18next";
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
  
  if (LOGO_FILES.length === 0) return null;
  
  // Double the logos for seamless infinite loop
  const logos = [...LOGO_FILES, ...LOGO_FILES];

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          {t('company_logos_title')}
        </h2>
        <div className="relative overflow-hidden">
          <div className="carousel-track flex gap-6 md:gap-8">
            {logos.map((file, idx) => (
              <div
                key={`${file}-${idx}`}
                className="carousel-item flex-shrink-0 bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-md ring-1 ring-gray-200 flex items-center justify-center p-4 md:p-6 transition-transform hover:shadow-xl hover:-translate-y-1"
              >
                <img
                  src={`/companies/${file}`}
                  alt={`${file.split('.')[0]} logo`}
                  className="w-auto h-auto object-contain"
                  style={{
                    maxWidth: isMobile ? '100px' : '140px',
                    maxHeight: isMobile ? '60px' : '80px',
                    width: 'auto',
                    height: 'auto'
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
      
      {/* CSS-only infinite scroll animation */}
      <style>{`
        .carousel-track {
          width: fit-content;
          animation: infiniteScroll 20s linear infinite;
        }
        
        .carousel-item {
          width: ${isMobile ? '120px' : '160px'};
          height: ${isMobile ? '80px' : '100px'};
          min-width: ${isMobile ? '120px' : '160px'};
        }
        
        @keyframes infiniteScroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        /* Pause on hover for better UX */
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
};
