import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface JobPosition {
  position_id: number;
  position_name: {
    en: string;
    ru: string;
    uz: string;
  };
  applied_count: number;
}

const JobPositionCard = ({ position, index, isTopPosition }: { 
  position: JobPosition; 
  index: number; 
  isTopPosition: boolean;
}) => {
  const { t, i18n } = useTranslation();
  
  const positionName = position.position_name[i18n.language as keyof typeof position.position_name] || 
                      position.position_name.en;

  return (
    <Card className="group transition-all duration-200 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          {/* Left side: Numbering */}
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-gray-400 dark:text-gray-500 w-8">
              {index + 1}.
            </span>
            
            {/* Position name with top badge */}
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {positionName}
              </h3>
              {isTopPosition && (
                <Badge 
                  variant="secondary" 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-none shadow-lg"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  {t('job_positions.top_badge')}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Right side: Applicants count */}
          <div className="flex items-center gap-2 text-lg font-medium text-gray-700 dark:text-gray-300">
            <span className="text-gray-500 dark:text-gray-400">
              {t('job_positions.applicants_label')}:
            </span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {position.applied_count}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const JobPositionsSkeleton = () => (
  <div className="space-y-4">
    {[...Array(4)].map((_, index) => (
      <Card key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-8" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export const JobPositionsListing = () => {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);
  const initialDisplayCount = 4;

  const { data: positionsResponse, isLoading, error } = useQuery({
    queryKey: ['/api/job-positions-with-applicants'],
    queryFn: async () => {
      const response = await fetch('/api/job-positions-with-applicants');
      if (!response.ok) throw new Error('Failed to fetch job positions');
      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  const positions = positionsResponse?.data || [];

  // Don't render if no positions with applicants
  if (!isLoading && (!positions || positions.length === 0)) {
    return null;
  }

  const displayedPositions = showAll ? positions : positions.slice(0, initialDisplayCount);
  const showPagination = positions.length > initialDisplayCount;

  return (
    <section className="py-16 px-6 bg-gradient-to-br from-gray-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            {t('job_positions.section_title')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {t('job_positions.section_subtitle')}
          </p>
        </div>

        {/* Positions List */}
        <div className="space-y-4">
          {isLoading ? (
            <JobPositionsSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400">
                Failed to load job positions. Please try again later.
              </p>
            </div>
          ) : (
            <>
              {displayedPositions.map((position, index) => {
                // Check if this position is in the top 3 overall (not just displayed)
                const isTopPosition = positions.findIndex(p => p.position_id === position.position_id) < 3;
                
                return (
                  <JobPositionCard
                    key={position.position_id}
                    position={position}
                    index={index}
                    isTopPosition={isTopPosition}
                  />
                );
              })}
            </>
          )}
        </div>

        {/* View More/Less Button */}
        {showPagination && !isLoading && (
          <div className="text-center mt-8">
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="outline"
              size="lg"
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              {showAll ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  {t('job_positions.view_less')}
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  {t('job_positions.view_more')}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};