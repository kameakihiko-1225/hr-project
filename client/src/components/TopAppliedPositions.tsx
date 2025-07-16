import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Users, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/lib/api";

interface TopPosition {
  positionId: number;
  positionTitle: string;
  appliedCount: number;
}

export const TopAppliedPositions = () => {
  const { t } = useTranslation();
  const [topPositions, setTopPositions] = useState<TopPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopPositions() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/top-applied-positions`);
        if (!response.ok) {
          throw new Error('Failed to fetch top applied positions');
        }
        
        const data = await response.json();
        console.log('Top applied positions API response:', data);
        
        if (data.success && data.data && Array.isArray(data.data)) {
          setTopPositions(data.data);
        } else {
          setTopPositions([]);
        }
      } catch (err) {
        console.error('Error fetching top applied positions:', err);
        setError(t('top_applied_positions.error'));
        setTopPositions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopPositions();
  }, [t]);

  // Don't render if no data and not loading
  if (!isLoading && topPositions.length === 0 && !error) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="mt-8 w-full max-w-6xl mx-auto">
        <div className="text-center mb-6">
          <Skeleton className="h-8 w-64 mx-auto" />
        </div>
        <div className="relative">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
              {[1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 flex-shrink-0"
                  style={{ 
                    width: '320px',
                    minWidth: '320px'
                  }}
                >
                  <div className="text-center">
                    <Skeleton className="h-6 w-8 mx-auto mb-2" />
                    <Skeleton className="h-6 w-32 mx-auto mb-3" />
                    <Skeleton className="h-12 w-16 mx-auto mb-2" />
                    <Skeleton className="h-4 w-20 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
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
          {t('top_applied_positions.title')}
        </h3>
      </div>
      
      {/* Top Position Cards - Horizontally Scrollable Triple View */}
      <div className="relative">
        {/* Scroll container */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-6 pb-4" style={{ minWidth: 'max-content' }}>
            {topPositions.map((position, index) => (
              <div
                key={position.positionId}
                className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 flex-shrink-0"
                style={{ 
                  width: '320px',
                  minWidth: '320px'
                }}
              >
                <div className="text-center">
                  {/* Rank Badge */}
                  <div className="flex items-center justify-center mb-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold rounded-full">
                      #{index + 1}
                    </span>
                  </div>
                  
                  {/* Position Title */}
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 line-clamp-2">
                    {position.positionTitle}
                  </h4>
                  
                  {/* Applied Count */}
                  <div className="mb-2">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {position.appliedCount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                      {t('top_applied_positions.applied')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Scroll indicators */}
        {topPositions.length > 2 && (
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              {Array.from({ length: Math.ceil(topPositions.length / 3) }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full opacity-50"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};