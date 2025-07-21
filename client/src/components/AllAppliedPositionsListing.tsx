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
      
      {/* Position Listing with Simplicity & Modern View Design */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {displayedPositions.map((position, index) => (
          <div
            key={position.positionId}
            className={`group flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200 ${
              index !== displayedPositions.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            {/* Left Side: Numbering */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all duration-200">
                {index + 1}
              </div>
              
              {/* Position Name */}
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 truncate">
                  {position.positionTitle}
                </h4>
              </div>
            </div>
            
            {/* Right Side: Applied Count */}
            <div className="flex-shrink-0 flex items-center space-x-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                {position.appliedCount}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {t('all_applied_positions.applied')}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* View More/Less Button */}
      {allPositions.length > 4 && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={showAll ? handleViewLess : handleViewMore}
            variant="outline"
            className="group border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-6 py-2 rounded-lg font-medium transition-all duration-200"
          >
            {showAll ? (
              <>
                {t('all_applied_positions.view_less')}
                <ChevronRight className="h-4 w-4 ml-2 rotate-180 group-hover:-translate-x-1 transition-transform duration-200" />
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