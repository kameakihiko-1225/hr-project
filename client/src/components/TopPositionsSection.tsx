import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp, Users, Building2, Briefcase, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from "@/lib/api";

interface TopPosition {
  positionId: number;
  applicantCount: number;
  positionTitle: string;
  companyName: string;
  departmentName: string;
}

export const TopPositionsSection = () => {
  const { t } = useTranslation();
  const [topPositions, setTopPositions] = useState<TopPosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopPositions() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/top-positions-with-counts`);
        if (!response.ok) {
          throw new Error('Failed to fetch top positions');
        }
        
        const data = await response.json();
        console.log('Top positions API response:', data);
        
        if (data.success && data.data && Array.isArray(data.data)) {
          // Filter out positions with 0 applicants
          const positionsWithApplicants = data.data.filter((pos: TopPosition) => pos.applicantCount > 0);
          setTopPositions(positionsWithApplicants);
        } else {
          console.log('No valid top positions data received');
          setTopPositions([]);
        }
      } catch (err) {
        console.error('Error fetching top positions:', err);
        setError(t('position_counter.error'));
        setTopPositions([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTopPositions();
  }, [t]);

  // Don't render anything if no positions have applicants
  if (!isLoading && topPositions.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
              <Skeleton className="h-8 w-64" />
            </div>
          </div>
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full max-w-sm">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
                    <Skeleton className="h-6 w-16 mx-auto mb-4" />
                    <Skeleton className="h-6 w-32 mx-auto mb-6" />
                    <Skeleton className="h-16 w-16 mx-auto mb-4" />
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-900/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              {t('position_counter.title')}
            </h2>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className={`grid gap-8 justify-items-center ${
            topPositions.length === 1 ? 'grid-cols-1' :
            topPositions.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          }`}>
            {topPositions.slice(0, 3).map((position, index) => (
              <div
                key={position.positionId}
                className="w-full max-w-sm transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-100 dark:hover:shadow-blue-900/30"
              >
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                  {/* Rank Badge */}
                  <div className="absolute top-4 right-4">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      #{index + 1}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="flex items-center justify-center mb-2">
                        <Briefcase className="h-6 w-6 text-blue-600 mr-2" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {position.positionTitle}
                      </h3>
                    </div>
                    
                    {/* Application Count */}
                    <div className="mb-6">
                      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                        {position.applicantCount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('position_counter.applicants')}
                      </div>
                    </div>
                    
                    {/* Company & Department Info */}
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        <span className="line-clamp-1">{position.companyName}</span>
                      </div>
                      <div className="flex items-center justify-center">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="line-clamp-1">{position.departmentName}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Decorative Elements */}
                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full opacity-50"></div>
                  <div className="absolute -top-2 -left-2 w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full opacity-30"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};