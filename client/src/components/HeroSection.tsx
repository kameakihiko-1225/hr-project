import { useState, useEffect } from "react";
import { ArrowRight, Users, Building, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPositions, getDepartments, getCompanies } from "@/lib/api";
import { useClickCounter } from "@/contexts/ClickCounterContext";
import { API_BASE_URL } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  companies: number;
  departments: number;
  positions: number;
  applicants: number;
}

export const HeroSection = () => {
  const { t } = useTranslation();
  const { jobSeekers, applicants } = useClickCounter();
  
  const [stats, setStats] = useState<Stats>({
    companies: 0,
    departments: 0,
    positions: 0,
    applicants: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [positionsResponse, departmentsData, companiesData, clickStatsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/positions?language=en`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          }),
          getDepartments(),
          getCompanies(),
          fetch(`${API_BASE_URL}/dashboard/click-stats`)
        ]);

        if (!positionsResponse.ok) {
          throw new Error(`Positions API failed: ${positionsResponse.status} ${positionsResponse.statusText}`);
        }

        const positionsData = await positionsResponse.json();
        const clickStatsData = await clickStatsResponse.json();
        
        // Debug logging
        console.log('Positions response:', positionsData);
        console.log('Positions response status:', positionsResponse.ok);
        console.log('Companies data:', companiesData);
        console.log('Departments data:', departmentsData);
        console.log('Click stats:', clickStatsData);
        
        // Use the total applies count from click stats as applicants data
        const realApplicantsCount = clickStatsData.success && clickStatsData.data ? clickStatsData.data.totalApplies : 0;
        const positionsCount = positionsData.success && positionsData.data ? positionsData.data.length : 0;

        setStats({
          companies: companiesData?.data?.length || 0,
          departments: departmentsData?.length || 0,
          positions: positionsCount,
          applicants: realApplicantsCount // Real applicant data from database
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
        setStats({
          companies: 0,
          departments: 0,
          positions: 0,
          applicants: 0
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [applicants]);

  // Function to scroll to a section by ID
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero-section" className="relative bg-white dark:bg-gray-950 py-12 sm:py-16 md:py-20 lg:py-24 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      
      {/* Floating elements - smaller on mobile */}
      <div className="absolute top-16 sm:top-20 left-4 sm:left-10 w-8 h-8 sm:w-16 sm:h-16 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-16 sm:bottom-20 right-4 sm:right-20 w-6 h-6 sm:w-12 sm:h-12 bg-indigo-100 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative">
        <div className="flex flex-col items-center text-center">
          {/* Content */}
          <div className="animate-fade-in max-w-4xl w-full">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight px-2">
              {t('hero.title_start')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 block">
                {t('hero.title_highlight')}
              </span>
            </h1>
            
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto px-4">{t('hero.subtitle')}</p>
            
            <div className="flex justify-center mb-6 sm:mb-8 px-4">
              <button 
                onClick={() => scrollToSection("filter-section")}
                className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group shadow-lg text-base sm:text-lg max-w-sm sm:max-w-none"
              >
                <span className="hidden sm:inline">{t('hero.cta_full')}</span>
                <span className="sm:hidden">{t('hero.cta_short')}</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Statistics - Fully Optimized for Mobile/Tablet/Phone */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 lg:gap-6 max-w-4xl mx-auto px-2 sm:px-4">
              <div className="bg-white/80 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Building className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-600" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 sm:h-6 md:h-8 w-8 sm:w-12 md:w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.companies}</div>
                )}
                <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 leading-tight px-1">{t('stats_cards.companies')}</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-green-600" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 sm:h-6 md:h-8 w-8 sm:w-12 md:w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.departments}</div>
                )}
                <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 leading-tight px-1">{t('stats_cards.departments')}</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Briefcase className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-purple-600" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 sm:h-6 md:h-8 w-8 sm:w-12 md:w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.positions}</div>
                )}
                <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 leading-tight px-1">{t('stats_cards.positions')}</div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-center mb-1 sm:mb-2">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-orange-600" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-4 sm:h-6 md:h-8 w-8 sm:w-12 md:w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{stats.applicants}</div>
                )}
                <div className="text-[10px] xs:text-xs sm:text-sm text-gray-600 leading-tight px-1">{t('stats_cards.applicants')}</div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </section>
  );
};