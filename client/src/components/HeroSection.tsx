import { useState, useEffect } from "react";
import { ArrowRight, Users, Building, Briefcase } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPositions, getDepartments, getCompanies } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  companies: number;
  departments: number;
  positions: number;
  applicants: number;
}

export const HeroSection = () => {
  const { t } = useTranslation();
  
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
        const [positionsData, departmentsData, companiesData] = await Promise.all([
          getPositions(),
          getDepartments(),
          getCompanies()
        ]);

        setStats({
          companies: companiesData?.data?.length || 0,
          departments: departmentsData?.length || 0,
          positions: positionsData?.length || 0,
          applicants: 42 // TODO: Get actual applicants count from API
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
  }, []);

  // Function to scroll to a section by ID
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="hero-section" className="relative bg-gradient-to-br from-blue-600/20 via-white to-[#1D4ED8]/20 py-12 md:py-16 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
        <div className="w-full h-full bg-gradient-to-l from-blue-600/20 to-transparent"></div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-12 h-12 bg-indigo-100 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="flex flex-col items-center text-center">
          {/* Content */}
          <div className="animate-fade-in max-w-4xl">
            <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
              <Briefcase className="h-4 w-4 mr-1.5" />
              {t('hero_badge')}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {t('hero_title_start')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 block">
                {t('hero_title_highlight')}
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed max-w-lg">
              {t('hero_subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button 
                onClick={() => scrollToSection("filter-section")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600/90 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center group shadow-md"
              >
                {t('hero_cta')}
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
                <div className="text-sm text-gray-600">{t('companies')}</div>
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
                <div className="text-sm text-gray-600">{t('departments')}</div>
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
                <div className="text-sm text-gray-600">{t('positions')}</div>
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
                <div className="text-sm text-gray-600">{t('applicants')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};