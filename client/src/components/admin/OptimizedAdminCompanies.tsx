import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Building, LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CompanyCard } from '@/components/CompanyCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminPerformance } from '@/hooks/useAdminPerformance';
import { Company } from '@/types/company';
import { toast } from '@/components/ui/use-toast';

export const OptimizedAdminCompanies: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const queryClient = useQueryClient();
  
  const { useOptimizedSearch, getLocalizedContent, invalidateRelatedQueries } = useAdminPerformance();

  // Optimized companies query with batch loading
  const { data: companies, isLoading, error } = useQuery({
    queryKey: ['companies', 'admin', 'optimized'],
    queryFn: async () => {
      const response = await fetch('/api/companies?raw=true&_optimize=true');
      if (!response.ok) throw new Error('Failed to fetch companies');
      const result = await response.json();
      return result.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnWindowFocus: false
  });

  // Optimized search with memoization
  const filteredCompanies = useOptimizedSearch<Company>(
    companies || [], 
    ['name', 'description', 'city'], 
    searchQuery
  );

  // Memoized grid layout to prevent re-renders
  const companiesGrid = useMemo(() => {
    return filteredCompanies.map((company) => (
      <CompanyCard 
        key={company.id}
        company={company}
        onEdit={() => {
          // Edit handler with optimistic updates
          console.log('Edit company:', company.id);
        }}
        onDelete={async () => {
          try {
            const response = await fetch(`/api/companies/${company.id}`, {
              method: 'DELETE'
            });
            
            if (response.ok) {
              // Optimistic update
              queryClient.setQueryData(['companies', 'admin', 'optimized'], 
                (old: Company[]) => old?.filter(c => c.id !== company.id) || []
              );
              
              // Invalidate related queries
              invalidateRelatedQueries('companies');
              
              toast({
                title: "Success",
                description: "Company deleted successfully"
              });
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to delete company",
              variant: "destructive"
            });
          }
        }}
      />
    ));
  }, [filteredCompanies, queryClient, invalidateRelatedQueries]);

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-600">Failed to load companies. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with performance-optimized controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* View mode toggle */}
          <ToggleGroup 
            type="single" 
            value={viewMode} 
            onValueChange={(value) => value && setViewMode(value as 'grid' | 'list')}
            className="border rounded-lg"
          >
            <ToggleGroupItem value="grid" aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="List view">
              <LayoutList className="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Company
        </Button>
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          {isLoading ? 'Loading...' : `${filteredCompanies.length} companies found`}
        </span>
      </div>

      {/* Optimized companies grid/list */}
      {isLoading ? (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {companiesGrid}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredCompanies.length === 0 && (
        <div className="text-center p-8">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No companies found' : 'No companies yet'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? `No companies match "${searchQuery}". Try adjusting your search.`
              : 'Get started by adding your first company.'
            }
          </p>
          {!searchQuery && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add First Company
            </Button>
          )}
        </div>
      )}
    </div>
  );
};