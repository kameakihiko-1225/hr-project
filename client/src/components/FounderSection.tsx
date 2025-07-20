import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
// Use the logo from public directory instead
// import founderImage from "@assets/Umidjon_aka-removebg-preview_1752578772239.png";

export const FounderSection = () => {
  const { t } = useTranslation();
  const scrollToPositions = () => {
    const positionsSection = document.getElementById('open-positions');
    if (positionsSection) {
      positionsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className="relative bg-white dark:bg-gray-950 py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-4 md:px-6 overflow-hidden">
      {/* Subtle background decoration - same as hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      
      <div className="max-w-6xl mx-auto relative">
        <div className="founder-section-layout"
          {/* Left side - Founder Photo */}
          <div className="founder-image-container items-center lg:items-center order-2 lg:order-1">
            {/* Image positioned to align top with heading */}
            <div className="relative overflow-hidden">
              <img
                src="/umidjon-founder.jpg"
                alt="Umidjon Ishmukhamedov"
                className="w-64 h-auto sm:w-80 md:w-96 lg:w-[28rem] object-cover drop-shadow-2xl rounded-2xl"
                style={{ maxHeight: '500px', objectFit: 'cover' }}
              />
            </div>
            
            {/* Text positioned at bottom to align with button */}
            <div className="founder-name-text">
              <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                {t('founder.name')}
              </h3>
              <p className="text-sm sm:text-base md:text-lg text-blue-600 dark:text-blue-400 font-semibold">
                {t('founder.title')}
              </p>
            </div>
          </div>

          {/* Right side - Inspirational Message */}
          <div className="founder-content-container order-1 lg:order-2">
            <div className="space-y-3 sm:space-y-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                {t('founder.mission_title')} 
                <span className="text-blue-600 dark:text-blue-400"> {t('founder.mission_highlight')}</span>
              </h2>
              
              <div className="prose prose-sm sm:prose-base md:prose-lg text-gray-700 dark:text-gray-300 max-w-none">
                <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4">
                  "{t('founder.quote1')}"
                </p>
                
                <p className="text-sm sm:text-base md:text-lg leading-relaxed mb-3 sm:mb-4">
                  "{t('founder.quote2')}"
                </p>
                
                <p className="text-sm sm:text-base md:text-lg leading-relaxed font-semibold text-blue-600 dark:text-blue-400">
                  "{t('founder.quote3')}"
                </p>
              </div>
            </div>

            {/* Button section */}
            <div className="button-section pt-3 sm:pt-4">
              <Button 
                onClick={scrollToPositions}
                size="default"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300"
              >
                <span className="hidden sm:inline">{t('founder.cta_full')}</span>
                <span className="sm:hidden">{t('founder.cta_short')}</span>
                <svg 
                  className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 8l4 4m0 0l-4 4m4-4H3" 
                  />
                </svg>
              </Button>
            </div>

            {/* Optional: Add some stats or achievements */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{t('founder.experience_number')}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('founder.experience_label')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">{t('founder.impact_number')}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{t('founder.impact_label')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};