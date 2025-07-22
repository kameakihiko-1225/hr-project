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

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">
          {t('company_logos_title')}
        </h2>
        <div className="carousel-container relative overflow-hidden">
          <div className="carousel-track">
            {/* Create a continuous stream by repeating logos multiple times */}
            {[...LOGO_FILES, ...LOGO_FILES, ...LOGO_FILES].map((file, idx) => (
              <div
                key={`logo-${file}-${idx}`}
                className="logo-card"
              >
                <img
                  src={`/companies/${file}`}
                  alt={`${file.split('.')[0]} logo`}
                  className="logo-image"
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
        .carousel-container {
          mask-image: linear-gradient(
            to right,
            transparent,
            black 10% 90%,
            transparent
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent,
            black 10% 90%,
            transparent
          );
        }
        
        .carousel-track {
          display: flex;
          gap: ${isMobile ? '16px' : '32px'};
          width: fit-content;
          animation: scroll 30s linear infinite;
          will-change: transform;
        }
        
        .logo-card {
          width: ${isMobile ? '120px' : '160px'};
          height: ${isMobile ? '80px' : '100px'};
          min-width: ${isMobile ? '120px' : '160px'};
          background: white;
          border-radius: ${isMobile ? '8px' : '12px'};
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: ${isMobile ? '12px' : '16px'};
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        
        .logo-card:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          transform: translateY(-4px);
        }
        
        .logo-image {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          filter: contrast(1.1) saturate(1.1);
        }
        
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }
        
        /* Pause animation on hover */
        .carousel-container:hover .carousel-track {
          animation-play-state: paused;
        }
        
        /* Responsive adjustments */
        @media (max-width: 640px) {
          .logo-group {
            gap: 12px;
            padding-right: 12px;
          }
        }
      `}</style>
    </section>
  );
};
