import { useState, useEffect } from "react";
import { PositionCard } from "@/components/PositionCard";
import { getPositions } from "@/lib/api";
import { getDepartments, getCompanies } from "@/lib/api";
import { Position } from "@/types/position";
import { AlertCircle, Filter } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";

interface OpenPositionsProps {
  selectedCompanies: string[];
  selectedDepartments: string[];
  selectedPositions: string[];
  hasSearched: boolean;
}

export const OpenPositions = ({ 
  selectedCompanies, 
  selectedDepartments, 
  selectedPositions,
  hasSearched
}: OpenPositionsProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Use React Query with cache-busting but stable key
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: positionsResponse, isLoading } = useQuery({
    queryKey: ['/api/positions', refreshKey], // Stable key that we can control
    queryFn: async () => {
      const response = await fetch(`/api/positions?_t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-cache', // Disable browser cache
      });
      if (!response.ok) throw new Error('Failed to fetch positions');
      return response.json();
    },
    staleTime: 0,
    gcTime: 0, 
    refetchOnMount: true,
  });

  const allPositions = positionsResponse?.data || [];
  
  // Debug log to track position data updates
  useEffect(() => {
    if (allPositions.length > 0) {
      console.log('⇠ positions from API (React Query)', allPositions);
      console.log('🔄 Cache timestamp:', new Date().toISOString());
      // Log apply links to verify they're current
      allPositions.forEach(pos => {
        console.log(`Position ${pos.id} (${pos.title}) applyLink:`, pos.applyLink);
      });
    }
  }, [allPositions]);

  // Refresh positions when coming from admin panel
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'positions_updated') {
        setRefreshKey(prev => prev + 1);
        localStorage.removeItem('positions_updated');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Set view mode based on mobile state
  useEffect(() => {
    setViewMode(isMobile ? "list" : "grid");
  }, [isMobile]);

  // Use React Query for departments and companies with proper caching
  const { data: departmentsResponse } = useQuery({
    queryKey: ['/api/departments'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const { data: companiesResponse } = useQuery({
    queryKey: ['/api/companies'],
    staleTime: 5 * 60 * 1000, // 5 minutes 
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const departments = departmentsResponse?.data || [];
  const companies = companiesResponse?.data || [];

  const filteredPositions = allPositions.filter(pos => {
    // Find department and company data for this position
    const department = departments.find(d => d.id === pos.departmentId);
    const company = department ? companies.find(c => c.id === department.companyId) : null;

    const companyName = company?.name || '';
    const departmentName = department?.name || '';

    const toLower = (s: string) => s.toLowerCase();

    const companyMatch =
      selectedCompanies.length === 0 ||
      selectedCompanies.some(c => toLower(c) === toLower(companyName));

    const departmentMatch =
      selectedDepartments.length === 0 ||
      selectedDepartments.some(d => toLower(d) === toLower(departmentName));

    const positionMatch =
      selectedPositions.length === 0 ||
      selectedPositions.some(sel => toLower(pos.title || '').includes(toLower(sel)));

    return companyMatch && departmentMatch && positionMatch;
  });

  // Filtering is working correctly - removed debug logs

  // Calculate pagination
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPositions = filteredPositions.slice(indexOfFirstItem, indexOfLastItem);

  // Generate page numbers for pagination
  const pageNumbers = [];
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
  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Render pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
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
    <section id="open-positions" className="relative py-16 px-6 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Subtle background decoration - same as hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Available Positions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Apply instantly and get interviewed with Telegram and go to the main interviews!
          </p>
          
          {hasSearched && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary" className="px-3 py-1 text-base">
                {filteredPositions.length} position{filteredPositions.length !== 1 ? 's' : ''} found
              </Badge>
              {(selectedCompanies.length > 0 || selectedDepartments.length > 0 || selectedPositions.length > 0) && (
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  <Filter className="h-3 w-3 mr-1" />
                  {getFilterSummary()}
                </Badge>
              )}
            </div>
          )}

          {isMobile && filteredPositions.length > 0 && hasSearched && (
            <div className="mt-4">
              <Button
                onClick={toggleViewMode}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {viewMode === "grid" ? "Switch to List View" : "Switch to Grid View"}
              </Button>
            </div>
          )}
        </div>

        <div id="job-listings">
          {filteredPositions.length > 0 ? (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 justify-items-center">
                  {currentPositions.map((pos, index) => (
                    <div key={pos.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in">
                      <PositionCard position={pos} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  {currentPositions.map((pos, index) => (
                    <div key={pos.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in">
                      <PositionCard position={pos} showDepartment={true} />
                    </div>
                  ))}
                </div>
              )}
              
              {renderPagination()}
              
              <div className="text-center text-gray-500 mt-4">
                Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPositions.length)} of {filteredPositions.length} positions
              </div>
            </>
          ) : (
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
          )}
        </div>
      </div>
    </section>
  );
};
