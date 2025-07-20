import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Users, Building2, Award, Briefcase } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useClickCounter } from "@/contexts/ClickCounterContext";
import { API_BASE_URL } from "@/lib/api";

interface StatsApi {
  companies: number;
  departments: number;
  positions: number;
  candidates: number;
}

export const StatsSection = () => {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const [isCompact, setIsCompact] = useState(false);
  const { jobSeekers, applicants } = useClickCounter();
  
  const [statsNumbers, setStatsNumbers] = useState({
    applicants: "-",
    companies: "-", 
    positions: "-",
    alwaysOpen: "24/7"
  });

  // Create stats array that updates with language changes
  const stats = [
    { icon: Users, number: statsNumbers.applicants, label: t('stats_cards.applicants'), description: t('stats_descriptions.applied_via_platform'), color: "from-blue-500 to-blue-600" },
    { icon: Building2, number: statsNumbers.companies, label: t('stats_cards.companies'), description: t('stats_descriptions.using_our_platform'), color: "from-indigo-500 to-indigo-600" },
    { icon: Briefcase, number: statsNumbers.positions, label: t('stats_cards.positions'), description: t('stats_descriptions.available_roles'), color: "from-green-500 to-green-600" },
    { icon: Award, number: statsNumbers.alwaysOpen, label: t('stats_descriptions.apply_anytime'), description: t('stats_descriptions.always_available'), color: "from-purple-500 to-purple-600" },
  ];

  // Load live stats from database
  useEffect(() => {
    const loadStats = async () => {
      try {
        // Load basic entity counts
        const res = await fetch(`${API_BASE_URL}/dashboard/stats`);
        if (!res.ok) return;
        const data = await res.json();
        
        // Load position click stats
        const clickRes = await fetch(`${API_BASE_URL}/dashboard/click-stats`);
        const clickData = clickRes.ok ? await clickRes.json() : null;
        
        if (data.success && data.data) {
          const apiStats: StatsApi = data.data;
          const clickStats = clickData?.success ? clickData.data : { totalViews: 0, totalApplies: 0 };
          
          setStatsNumbers({
            applicants: (clickStats.totalApplies + applicants).toString(),
            companies: apiStats.companies.toString(),
            positions: apiStats.positions.toString(),
            alwaysOpen: "24/7"
          });
        }
      } catch (error) {
        console.error('Failed to load stats', error);
      }
    };

    loadStats();
  }, [jobSeekers, applicants]);

  useEffect(() => {
    setIsCompact(isMobile);
  }, [isMobile]);

  // Render a compact horizontal stat card - Improved for mobile/tablet with center alignment
  const renderCompactStat = (stat: any, index: number) => (
    <div 
      key={stat.label}
      className="bg-white p-2 sm:p-3 md:p-4 rounded-lg sm:rounded-xl shadow-sm border border-gray-100 flex items-center gap-2 sm:gap-3 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 w-full max-w-xs mx-auto"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-r ${stat.color} rounded-lg sm:rounded-xl flex items-center justify-center`}>
        <stat.icon className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-white" />
      </div>
      
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">{stat.number}</h3>
        </div>
        <div className="flex flex-col">
          <h4 className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{stat.label}</h4>
          <p className="text-[10px] sm:text-xs text-gray-600 line-clamp-1">{stat.description}</p>
        </div>
      </div>
    </div>
  );

  // Render a standard stat card - Improved for mobile/tablet
  const renderStatCard = (stat: any, index: number) => (
    <div 
      key={stat.label}
      className="text-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4`}>
        <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
      </div>
      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{stat.number}</h3>
      <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-1 leading-tight">{stat.label}</h4>
      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{stat.description}</p>
    </div>
  );

  return (
    <section className="relative py-16 sm:py-20 md:py-24 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Subtle background decoration - same as hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('stats_title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('stats_subtitle')}
          </p>
          
          {isMobile && (
            <button 
              onClick={() => setIsCompact(!isCompact)}
              className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isCompact ? t('toggle_card') : t('toggle_compact')}
            </button>
          )}
        </div>

        {/* Render stats grid - Improved responsive layout */}
        <div className={`animate-fade-in ${
          isCompact 
            ? "flex flex-col items-center gap-3 max-w-sm mx-auto" 
            : "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6"
        }`}>
          {stats.map((stat, index) => 
            isCompact ? renderCompactStat(stat, index) : renderStatCard(stat, index)
          )}
        </div>
      </div>
    </section>
  );
};
