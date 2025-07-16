import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Users, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/lib/api";

interface PositionCount {
  positionId: number;
  applicantCount: number;
  positionTitle: string;
}

export const PositionCounterCard = () => {
  const { t } = useTranslation();
  const [positionCounts, setPositionCounts] = useState<PositionCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPositionCounts() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/dashboard/position-applicant-counts`);
        if (!response.ok) {
          throw new Error('Failed to fetch position counts');
        }
        
        const data = await response.json();
        console.log('Position counts API response:', data);
        
        if (data.success && data.data && Array.isArray(data.data)) {
          // Take top 3 positions by applicant count
          const topPositions = data.data
            .sort((a: PositionCount, b: PositionCount) => b.applicantCount - a.applicantCount)
            .slice(0, 3);
          console.log('Top 3 positions:', topPositions);
          setPositionCounts(topPositions);
        } else {
          console.log('No valid position data received');
          setPositionCounts([]);
        }
      } catch (err) {
        console.error('Error fetching position counts:', err);
        setError(t('position_counter.error'));
        setPositionCounts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPositionCounts();
  }, [t]);

  if (isLoading) {
    return (
      <div className="mt-12 w-full max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Skeleton className="h-4 w-24 mx-auto mb-2" />
                <Skeleton className="h-8 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12 w-full max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (positionCounts.length === 0) {
    return (
      <div className="mt-12 w-full max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center text-gray-500 dark:text-gray-400">
            <Users className="h-5 w-5 mr-2" />
            <span className="text-sm">{t('position_counter.no_data')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 w-full max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-800 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-center mb-6">
          <TrendingUp className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('position_counter.title')}
          </h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {positionCounts.map((position, index) => (
            <div
              key={position.positionId}
              className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300"
            >
              <div className="flex items-center justify-center mb-2">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  #{index + 1}
                </span>
              </div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
                {position.positionTitle}
              </h4>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {position.applicantCount.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {t('position_counter.applicants')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};