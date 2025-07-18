import { useState, useEffect } from "react";
import { Target, TrendingUp, Ban, Cpu, Layers, ThumbsUp, Bot, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

export const FeaturesSection = () => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isCompact, setIsCompact] = useState(false);
  
  useEffect(() => {
    setIsCompact(isMobile);
  }, [isMobile]);
  
  const features = [
    {
      icon: Target,
      title: t('features_cards.mission.title'),
      description: t('features_cards.mission.description'),
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: TrendingUp,
      title: t('features_cards.growth.title'),
      description: t('features_cards.growth.description'),
      color: "from-green-500 to-green-600"
    },
    {
      icon: Ban,
      title: t('features_cards.culture.title'),
      description: t('features_cards.culture.description'),
      color: "from-purple-500 to-purple-600"
    },
    {
      icon: Cpu,
      title: t('features_cards.innovation.title'),
      description: t('features_cards.innovation.description'),
      color: "from-indigo-500 to-indigo-600"
    },
    {
      icon: Layers,
      title: t('features_cards.benefits.title'),
      description: t('features_cards.benefits.description'),
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: ThumbsUp,
      title: t('features_cards.impact.title'),
      description: t('features_cards.impact.description'),
      color: "from-red-500 to-red-600"
    }
  ];

  // Function to scroll to a section by ID
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const toggleView = () => {
    setIsCompact(!isCompact);
  };

  // Render a feature card - horizontal compact version
  const renderCompactFeature = (feature: any, index: number) => (
    <div
      key={feature.title}
      className="group relative bg-white p-4 rounded-xl shadow border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex items-center gap-4"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
        <feature.icon className="h-6 w-6 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors truncate">
          {feature.title}
        </h3>
        <p className="text-gray-600 text-sm line-clamp-2">
          {feature.description}
        </p>
      </div>
      
      <ChevronRight className="flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </div>
  );

  // Render a feature card - original card version
  const renderFeatureCard = (feature: any, index: number) => (
    <div
      key={feature.title}
      className="group relative bg-white p-6 rounded-xl shadow border border-gray-100 hover:shadow-xl hover:shadow-blue-100 transition-all duration-300 hover:-translate-y-1"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Icon */}
      <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
        <feature.icon className="h-7 w-7 text-white" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
        {feature.title}
      </h3>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        {feature.description}
      </p>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );

  return (
    <section className="relative py-20 px-4 md:py-24 md:px-6 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Subtle background decoration - same as hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-10">
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <Target className="h-4 w-4 mr-2" />
            {t('features.badge')}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('features.title_start')}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 block">
              {t('features.title_highlight')}
            </span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('features.subtitle')}
          </p>
          
          {isMobile && (
            <button 
              onClick={toggleView}
              className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isCompact ? t('features.toggle_detailed') : t('features.toggle_compact')}
            </button>
          )}
        </div>

        <div className={isCompact 
          ? "flex flex-col space-y-3" 
          : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        }>
          {features.map((feature, index) => 
            isCompact 
              ? renderCompactFeature(feature, index)
              : renderFeatureCard(feature, index)
          )}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div 
            onClick={() => scrollToSection("filter-section")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full font-semibold hover:from-blue-700 hover:to-indigo-700 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 cursor-pointer shadow-lg"
          >
            <Bot className="h-5 w-5" />
            <span className="hidden sm:inline">{t('features.cta_full')}</span>
            <span className="sm:hidden">{t('features.cta_short')}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
