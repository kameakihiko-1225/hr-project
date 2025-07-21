import { useState, useEffect } from "react";
import { PositionCard } from "@/components/PositionCard";
import { getPositions } from "@/lib/api";
import { getDepartments, getCompanies } from "@/lib/api";
import { Position } from "@/types/position";
import { getLocalizedContent } from "@shared/schema";
import { AlertCircle, Filter } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';

interface OpenPositionsProps {
  selectedCompanies: number[];
  selectedDepartments: number[];
  selectedPositions: number[];
  hasSearched: boolean;
}

export const OpenPositions = ({ 
  selectedCompanies, 
  selectedDepartments, 
  selectedPositions,
  hasSearched
}: OpenPositionsProps) => {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const isMobile = useIsMobile();


  // Use React Query with optimized caching and language parameter for localization
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: positionsResponse, isLoading, error } = useQuery({
    queryKey: ['positions', 'all', i18n.language, 'public'], // Optimized query key structure
    queryFn: async () => {
      try {
        const abortController = new AbortController();
        const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout
        
        const response = await fetch(`/api/positions?language=${i18n.language}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate, br', // Enable compression
          },
          signal: abortController.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch positions`);
        }
        const data = await response.json();
        return data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.error('Request timed out:', err);
          throw new Error('Request timed out. Please try again.');
        } else if (err instanceof DOMException) {
          console.error('DOM Exception during fetch:', err);
          throw new Error('Network error occurred. Please check your connection.');
        } else {
          console.error('Error fetching positions:', err);
          throw err;
        }
      }
    },
    staleTime: 0,
    gcTime: 0, 
    refetchOnMount: true,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const allPositions = positionsResponse?.data || [];
  
  // Debug log to track position data updates
  useEffect(() => {
    if (allPositions.length > 0) {
      console.log('⇠ positions from API (React Query)', allPositions);
      console.log('🔄 Cache timestamp:', new Date().toISOString());
      // Log apply links to verify they're current
      allPositions.forEach((pos: any) => {
        console.log(`Position ${pos.id} (${pos.title}) applyLink:`, pos.applyLink);
      });
    }
  }, [allPositions]);

  // Refresh positions when coming from admin panel
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'positions_updated') {
        setRefreshKey(prev => prev + 1);
        localStorage.removeItem('positions_updated');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);



  // Use React Query for departments and companies with proper caching
  const { data: departmentsResponse } = useQuery({
    queryKey: ['/api/departments', i18n.language],
    queryFn: async () => {
      const response = await fetch(`/api/departments?language=${i18n.language}`);
      if (!response.ok) throw new Error('Failed to fetch departments');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: companiesResponse } = useQuery({
    queryKey: ['/api/companies', i18n.language],
    queryFn: async () => {
      const response = await fetch(`/api/companies?language=${i18n.language}`);
      if (!response.ok) throw new Error('Failed to fetch companies');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes 
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch applicant counts for positions
  const { data: applicantCountsResponse } = useQuery({
    queryKey: ['/api/all-applied-positions', i18n.language],
    queryFn: async () => {
      const response = await fetch(`/api/all-applied-positions?language=${i18n.language}`);
      if (!response.ok) throw new Error('Failed to fetch applied positions');
      return response.json();
    },
    staleTime: 60 * 1000, // 1 minute (shorter cache for dynamic data)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const departments = departmentsResponse?.data || [];
  const companies = companiesResponse?.data || [];
  const applicantCounts = applicantCountsResponse?.data || [];

  // Create a map for easy lookup of applicant counts and determine top-tier badges
  const applicantCountMap = new Map<number, { count: number; topTierBadge?: 1 | 2 | 3 }>();
  
  applicantCounts.forEach((item: any, index: number) => {
    const badge = index < 3 ? (index + 1) as (1 | 2 | 3) : undefined;
    applicantCountMap.set(item.positionId, { 
      count: item.appliedCount, 
      topTierBadge: badge 
    });
  });

  // Log current filter selections
  console.log('Current filter selections:', { selectedCompanies, selectedDepartments, selectedPositions });
  console.log('Total positions to filter:', allPositions.length);

  const filteredPositions = allPositions.filter((pos: any) => {
    // Find department and company data for this position
    const department = departments.find((d: any) => d.id === pos.departmentId);
    const company = department ? companies.find((c: any) => c.id === department.companyId) : null;

    // Handle localized content properly
    const getLocalizedText = (content: any) => {
      if (!content) return '';
      if (typeof content === 'string') return content;
      if (typeof content === 'object') {
        return content[i18n.language] || content.en || content.ru || content.uz || '';
      }
      return '';
    };

    // Use the same language as FilterSection for consistent matching
    const companyName = company?.name ? getLocalizedContent(company.name, i18n.language as "en" | "ru" | "uz") : '';
    const departmentName = department?.name ? getLocalizedContent(department.name, i18n.language as "en" | "ru" | "uz") : '';

    // Debug logging for all positions to find Millat Umidi School positions
    if (company?.id === 9 || companyName.includes('School') || pos.id === 23 || pos.id === 24) {
      console.log('🏫 School Position Found - ID:', pos.id, 'Title:', getLocalizedText(pos.title));
      console.log('Company ID:', company?.id, 'Company Name:', companyName);
      console.log('Department ID:', department?.id, 'Department Name:', departmentName);
      console.log('Raw company object:', company);
    }

    const toLower = (s: string) => s.toLowerCase();

    // Company filter logic - use ID comparison instead of name
    const companyMatch =
      selectedCompanies.length === 0 ||
      selectedCompanies.includes(company?.id);

    // Department filter logic - use ID comparison instead of name
    const departmentMatch =
      selectedDepartments.length === 0 ||
      selectedDepartments.includes(pos.departmentId);

    // Position filter logic - use ID comparison instead of name
    const positionMatch =
      selectedPositions.length === 0 ||
      selectedPositions.includes(pos.id);

    const matches = companyMatch && departmentMatch && positionMatch;
    
    // More debug logging
    if (selectedCompanies.length > 0 && companyName.includes('Millat Umidi School')) {
      console.log('Company Match:', companyMatch, 'Department Match:', departmentMatch, 'Position Match:', positionMatch);
      console.log('Overall Match:', matches);
    }

    return matches;
  }).sort((a: any, b: any) => {
    // Sort by application count in descending order (most applied first)
    const aCount = applicantCountMap.get(a.id)?.count || 0;
    const bCount = applicantCountMap.get(b.id)?.count || 0;
    return bCount - aCount; // Descending order: highest applications first
  });

  // Filtering is working correctly - removed debug logs

  // Calculate pagination - only for desktop, show all on mobile
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Show all positions on mobile (no pagination), paginate on desktop
  const currentPositions = isMobile 
    ? filteredPositions 
    : filteredPositions.slice(indexOfFirstItem, indexOfLastItem);

  // Generate page numbers for pagination
  const pageNumbers: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Handle page change
  const handlePageChange = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
    // Scroll to top of job listings
    document.getElementById('job-listings')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Generate filter summary text
  const getFilterSummary = () => {
    const filters = [];
    if (selectedCompanies.length > 0) filters.push(`${selectedCompanies.length} companies`);
    if (selectedDepartments.length > 0) filters.push(`${selectedDepartments.length} departments`);
    if (selectedPositions.length > 0) filters.push(`${selectedPositions.length} positions`);
    
    return filters.length > 0 
      ? `Filtered by: ${filters.join(', ')}` 
      : "Showing all positions";
  };

  // Toggle view mode


  // Render pagination controls - only on desktop
  const renderPagination = () => {
    if (totalPages <= 1 || isMobile) return null;
    
    return (
      <div className="mt-10">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageChange(currentPage - 1)}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {pageNumbers.map(number => (
              <PaginationItem key={number}>
                <PaginationLink
                  isActive={number === currentPage}
                  onClick={() => handlePageChange(number)}
                  className="cursor-pointer"
                >
                  {number}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageChange(currentPage + 1)}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

  return (
    <section id="open-positions" className="relative py-8 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 bg-white dark:bg-gray-950 overflow-visible z-0">
      {/* Subtle background decoration - same as hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-2">
            {t('positions.available_positions')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 sm:px-4">
            {t('positions.apply_instantly')}
          </p>
          
          {hasSearched && (
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center justify-center gap-1 sm:gap-2 px-2">
              <Badge variant="secondary" className="px-2 sm:px-3 py-1 text-xs sm:text-sm md:text-base">
                {filteredPositions.length} {filteredPositions.length === 1 ? t('positions.position_found') : t('positions.positions_found')}
              </Badge>
              {(selectedCompanies.length > 0 || selectedDepartments.length > 0 || selectedPositions.length > 0) && (
                <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                  <Filter className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                  <span className="hidden sm:inline">{getFilterSummary()}</span>
                  <span className="sm:hidden">Filtered</span>
                </Badge>
              )}
            </div>
          )}


        </div>

        <div id="job-listings">
          {error && (
            <Alert variant="destructive" className="mb-8">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error loading positions</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load positions. Please try again.'}
              </AlertDescription>
            </Alert>
          )}
          
          {!error && isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading positions...</span>
            </div>
          )}
          
          {!error && !isLoading && filteredPositions.length > 0 ? (
            <>
              {/* Always show horizontal scroll on mobile, grid on desktop */}
              <div className="md:grid md:grid-cols-2 xl:grid-cols-3 md:gap-6 md:justify-items-center">
                {/* Mobile horizontal scroll container - Always enabled */}
                <div className="md:hidden overflow-x-auto scrollbar-hide pb-2">
                  <div className="flex gap-2 px-2 sm:gap-3 sm:px-3" style={{ width: 'max-content' }}>
                    {currentPositions.map((pos: any, index: number) => {
                      const applicantData = applicantCountMap.get(pos.id);
                      return (
                        <div 
                          key={pos.id} 
                          style={{ animationDelay: `${index * 100}ms` }} 
                          className="animate-fade-in flex-shrink-0 w-[260px] sm:w-[300px]"
                        >
                          <PositionCard 
                            position={pos} 
                            applicantCount={applicantData?.count}
                            topTierBadge={applicantData?.topTierBadge}
            
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Enhanced scroll indicator for mobile */}
                  <div className="flex justify-center items-center mt-3">
                    <div className="flex items-center space-x-1">
                      {currentPositions.slice(0, Math.min(4, currentPositions.length)).map((_: any, index: number) => (
                        <div key={index} className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                      ))}
                      {currentPositions.length > 4 && (
                        <div className="text-xs text-blue-600 ml-2 font-medium">
                          +{currentPositions.length - 4} more →
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Desktop grid layout */}
                <div className="hidden md:contents">
                  {currentPositions.map((pos: any, index: number) => {
                    const applicantData = applicantCountMap.get(pos.id);
                    return (
                      <div key={pos.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in w-full max-w-[480px]">
                        <PositionCard 
                          position={pos} 
                          applicantCount={applicantData?.count}
                          topTierBadge={applicantData?.topTierBadge}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {renderPagination()}
              
              {/* Show position count info only on desktop */}
              {!isMobile && (
                <div className="text-center text-gray-500 mt-4">
                  {t('positions.showing')} {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPositions.length)} {t('positions.of')} {filteredPositions.length} {filteredPositions.length === 1 ? t('positions.position_found') : t('positions.positions_found')}
                </div>
              )}
            </>
          ) : !error && !isLoading ? (
            <Alert variant="default" className="bg-blue-50 border-blue-200 mb-12">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-xl font-semibold text-gray-800 mb-2">
                No positions match your filters
              </AlertTitle>
              <AlertDescription className="text-gray-600">
                {hasSearched ? (
                  <>
                    <p className="mb-4">
                      We couldn't find any positions matching your current filter criteria. 
                      Try broadening your search by:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Selecting different companies</li>
                      <li>Choosing additional departments</li>
                      <li>Adding more position types</li>
                    </ul>
                  </>
                ) : (
                  <p>Use the search button above to find available positions.</p>
                )}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </div>
    </section>
  );
};
