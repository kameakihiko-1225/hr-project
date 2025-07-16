import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ChevronRight, Users, AlertCircle, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

interface AppliedPosition {
  positionId: number;
  positionTitle: string;
  appliedCount: number;
}

export const AllAppliedPositionsListing = () => {
  const { t } = useTranslation();
  const [allPositions, setAllPositions] = useState<AppliedPosition[]>([]);
  const [displayedPositions, setDisplayedPositions] = useState<AppliedPosition[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/all-applied-positions`);
      if (!response.ok) {
        throw new Error('Failed to fetch applied positions');
      }
      
      const result = await response.json();
      console.log('All applied positions API response:', result);
      
      if (result.success && result.data && Array.isArray(result.data)) {
        setAllPositions(result.data);
        // Initially show only first 4 positions
        setDisplayedPositions(result.data.slice(0, 4));
      } else {
        setAllPositions([]);
        setDisplayedPositions([]);
      }
    } catch (err) {
      console.error('Error fetching applied positions:', err);
      setError(t('all_applied_positions.error'));
      setAllPositions([]);
      setDisplayedPositions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, [t]);

  const handleViewMore = () => {
    setDisplayedPositions(allPositions);
    setShowAll(true);
  };

  const handleViewLess = () => {
    setDisplayedPositions(allPositions.slice(0, 4));
    setShowAll(false);
  };

  // Don't render if no data and not loading
  if (!isLoading && allPositions.length === 0 && !error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-8 w-full max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <Skeleton className="h-8 w-80 mx-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && allPositions.length === 0) {
    return (
      <div className="mt-8 w-full max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 w-full max-w-6xl mx-auto">
      {/* Section Title */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('all_applied_positions.title')}
        </h3>
      </div>
      
      {/* Position Listing with Futuristic Design */}
      <div className="space-y-4">
        {displayedPositions.map((position) => (
          <div
            key={position.positionId}
            className="group bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
          >
            {/* Gradient Background Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
            
            <div className="relative flex items-center justify-between">
              {/* Position Info */}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                  {position.positionTitle}
                </h4>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4 mr-1" />
                  <span className="font-medium">
                    {position.appliedCount.toLocaleString()} {t('all_applied_positions.applied')}
                  </span>
                </div>
              </div>
              
              {/* Applied Count Badge */}
              <div className="ml-4">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
                  {position.appliedCount.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* View More/Less Button */}
      {allPositions.length > 4 && (
        <div className="flex justify-center mt-8">
          <Button
            onClick={showAll ? handleViewLess : handleViewMore}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            {showAll ? (
              <>
                {t('all_applied_positions.view_less')}
                <ChevronRight className="h-4 w-4 ml-2 rotate-90 group-hover:-translate-y-1 transition-transform duration-200" />
              </>
            ) : (
              <>
                {t('all_applied_positions.view_more')}
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};