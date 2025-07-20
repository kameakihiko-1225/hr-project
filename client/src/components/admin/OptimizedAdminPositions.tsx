import React, { useState, useMemo } from 'react';
import { useOptimizedAdminQueries } from '@/hooks/useOptimizedAdminQueries';
import { useAdminPerformance } from '@/hooks/useAdminPerformance';
import { Plus, Search, Briefcase, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminPositionCard } from '@/components/AdminPositionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Position } from '@/types/position';
import { toast } from '@/components/ui/use-toast';

interface OptimizedAdminPositionsProps {
  selectedDepartmentId?: string;
  onDepartmentChange?: (departmentId: string) => void;
}

export const OptimizedAdminPositions: React.FC<OptimizedAdminPositionsProps> = ({
  selectedDepartmentId = 'all',
  onDepartmentChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { useOptimizedPositions, useOptimizedCRUD } = useOptimizedAdminQueries();
  const { useOptimizedSearch, getLocalizedContent } = useAdminPerformance();
  const { deleteMutation } = useOptimizedCRUD();

  // Optimized positions data with batch loading
  const { data, isLoading, error } = useOptimizedPositions(selectedDepartmentId, true);
  
  const positions = data?.positions || [];
  const departments = data?.departments || [];
  const companies = data?.companies || [];
  const applicantCounts = data?.applicantCounts || [];

  // Optimized search with memoization
  const filteredPositions = useOptimizedSearch<Position>(
    positions,
    ['title', 'description', 'salaryRange'],
    searchTerm
  );

  // Memoized department options for better performance
  const departmentOptions = useMemo(() => {
    return departments.map((dept: any) => {
      const company = companies.find((c: any) => c.id === dept.companyId);
      const departmentName = getLocalizedContent(dept.name);
      const companyName = company ? getLocalizedContent(company.name) : '';
      
      return {
        value: dept.id.toString(),
        label: companyName ? `${departmentName} (${companyName})` : departmentName
      };
    });
  }, [departments, companies, getLocalizedContent]);

  // Memoized positions grid
  const positionsGrid = useMemo(() => {
    return filteredPositions.map((position) => {
      const applicantCount = applicantCounts.find(
        (count: any) => count.positionId === position.id
      )?.appliedCount || 0;

      return (
        <AdminPositionCard
          key={position.id}
          position={position}
          applicantCount={applicantCount}
          onEdit={() => {
            console.log('Edit position:', position.id);
          }}
          onDelete={async () => {
            try {
              await deleteMutation.mutateAsync({
                endpoint: `/api/positions/${position.id}`
              });
            } catch (error) {
              console.error('Failed to delete position:', error);
            }
          }}
        />
      );
    });
  }, [filteredPositions, applicantCounts, deleteMutation]);

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to load positions data. Please try again.</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance-optimized header controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Department filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select 
              value={selectedDepartmentId} 
              onValueChange={onDepartmentChange}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentOptions.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Position
        </Button>
      </div>

      {/* Performance info and results summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {isLoading 
            ? 'Loading positions...' 
            : `${filteredPositions.length} positions found`
          }
        </span>
        {data?.performanceInfo && (
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            Loaded in {data.performanceInfo.queryTime}ms
          </span>
        )}
      </div>

      {/* Optimized positions grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {positionsGrid}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredPositions.length === 0 && (
        <div className="text-center p-8">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No positions found' : 'No positions yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm 
              ? `No positions match "${searchTerm}". Try adjusting your search.`
              : selectedDepartmentId !== 'all'
                ? 'No positions in this department yet.'
                : 'Get started by adding your first position.'
            }
          </p>
          {!searchTerm && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Position
            </Button>
          )}
        </div>
      )}
    </div>
  );
};