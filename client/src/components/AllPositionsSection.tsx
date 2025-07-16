import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { 
  Briefcase, Building2, Users, MapPin, Clock, DollarSign, 
  ChevronLeft, ChevronRight, ExternalLink, AlertCircle,
  Building
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { API_BASE_URL } from "@/lib/api";

interface Position {
  id: number;
  title: string;
  description: string;
  companyName: string;
  departmentName: string;
  city: string;
  country: string;
  salaryRange: string;
  employmentType: string;
  applyLink: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AllPositionsData {
  positions: Position[];
  pagination: PaginationInfo;
}

export const AllPositionsSection = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<AllPositionsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const fetchPositions = async (page: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/all-positions?page=${page}&limit=${itemsPerPage}`);
      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }
      
      const result = await response.json();
      console.log('All positions API response:', result);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        console.log('No valid positions data received');
        setData(null);
      }
    } catch (err) {
      console.error('Error fetching positions:', err);
      setError(t('positions_section.error'));
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions(currentPage);
  }, [currentPage, t]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Smooth scroll to top of section
    document.getElementById('all-positions-section')?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  const truncateDescription = (description: string, maxLength: number = 150) => {
    if (description.length <= maxLength) return description;
    return description.slice(0, maxLength).trim() + '...';
  };

  if (isLoading) {
    return (
      <section id="all-positions-section" className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto" />
          </div>
          
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <Skeleton className="h-6 w-48 mb-4" />
                  <Skeleton className="h-4 w-32 mb-4" />
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-24" />
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
      <section id="all-positions-section" className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      </section>
    );
  }

  if (!data || data.positions.length === 0) {
    return (
      <section id="all-positions-section" className="py-16 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('positions_section.no_positions')}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="all-positions-section" className="py-16 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Briefcase className="h-8 w-8 text-blue-600 mr-3" />
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              {t('positions_section.all_positions_title')}
            </h2>
          </div>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {/* Positions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {data.positions.map((position) => (
              <div
                key={position.id}
                className="group bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/30"
              >
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {position.title}
                    </h3>
                    
                    {/* Company & Department */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-1" />
                        <span>{position.companyName}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        <span>{position.departmentName}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Description */}
                  <div className="mb-4 flex-grow">
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {truncateDescription(position.description)}
                    </p>
                  </div>
                  
                  {/* Details */}
                  <div className="space-y-2 mb-6 text-sm">
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{position.city}, {position.country}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{position.employmentType}</span>
                    </div>
                    <div className="flex items-center text-gray-600 dark:text-gray-400">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>{position.salaryRange}</span>
                    </div>
                  </div>
                  
                  {/* Apply Button */}
                  <div className="mt-auto">
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none transition-all duration-300 group-hover:shadow-lg"
                    >
                      <a href={position.applyLink} target="_blank" rel="noopener noreferrer">
                        <span>{t('positions_section.apply_now')}</span>
                        <ExternalLink className="h-4 w-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                {t('positions_section.previous')}
              </Button>
              
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t('positions_section.page_info', { 
                    page: data.pagination.page, 
                    total: data.pagination.totalPages 
                  })}
                </span>
              </div>
              
              <Button
                variant="outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === data.pagination.totalPages}
                className="flex items-center"
              >
                {t('positions_section.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
          
          {/* More Companies Button */}
          <div className="text-center mt-12">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white border-none px-8 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100 dark:hover:shadow-indigo-900/30"
            >
              <a href="/companies">
                <Building className="h-5 w-5 mr-2" />
                {t('positions_section.more_companies')}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};