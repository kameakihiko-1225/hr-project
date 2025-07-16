import { useState, useEffect } from "react";
import { ArrowRight, Users, Building, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPositions, getDepartments, getCompanies } from "@/lib/api";
import { useClickCounter } from "@/contexts/ClickCounterContext";
import { API_BASE_URL } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { PositionCounterCard } from "@/components/PositionCounterCard";
import { TopAppliedPositions } from "@/components/TopAppliedPositions";
import { AllAppliedPositionsListing } from "@/components/AllAppliedPositionsListing";

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
        const [positionsData, departmentsData, companiesData, clickStatsResponse] = await Promise.all([
          getPositions(),
          getDepartments(),
          getCompanies(),
          fetch(`${API_BASE_URL}/dashboard/click-stats`)
        ]);

        const clickStatsData = await clickStatsResponse.json();
        // Use the total applies count from click stats as applicants data
        const realApplicantsCount = clickStatsData.success && clickStatsData.data ? clickStatsData.data.totalApplies : 0;

        setStats({
          companies: companiesData?.data?.length || 0,
          departments: departmentsData?.length || 0,
          positions: positionsData?.length || 0,
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
    <section id="hero-section" className="relative bg-white dark:bg-gray-950 py-20 md:py-24 overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-12 h-12 bg-indigo-100 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col items-center text-center">
          {/* Content */}
          <div className="animate-fade-in max-w-4xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t('hero.title_start')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 block">
                {t('hero.title_highlight')}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-4xl mx-auto">{t('hero.subtitle')}</p>
            
            <div className="flex justify-center mb-8">
              <button 
                onClick={() => scrollToSection("filter-section")}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center group shadow-lg text-lg"
              >
                <span className="hidden sm:inline">{t('hero.cta_full')}</span>
                <span className="sm:hidden">{t('hero.cta_short')}</span>
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Building className="h-5 w-5 text-blue-600 mr-1" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900">{stats.companies}</div>
                )}
                <div className="text-sm text-gray-600">{t('stats_cards.companies')}</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-green-600 mr-1" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900">{stats.departments}</div>
                )}
                <div className="text-sm text-gray-600">{t('stats_cards.departments')}</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Briefcase className="h-5 w-5 text-purple-600 mr-1" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900">{stats.positions}</div>
                )}
                <div className="text-sm text-gray-600">{t('stats_cards.positions')}</div>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-orange-600 mr-1" />
                </div>
                {isLoading ? (
                  <Skeleton className="h-8 w-16 mx-auto mb-1" />
                ) : (
                  <div className="text-2xl font-bold text-gray-900">{stats.applicants}</div>
                )}
                <div className="text-sm text-gray-600">{t('stats_cards.applicants')}</div>
              </div>
            </div>

            {/* Top Applied Positions - Up to 3 counter cards */}
            <TopAppliedPositions />
            
            {/* All Applied Positions Listing - Paginated list */}
            <AllAppliedPositionsListing />
          </div>
        </div>
      </div>
    </section>
  );
};