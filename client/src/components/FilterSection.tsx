import { useState, useEffect } from "react";
import { MultiSelect } from "@/components/MultiSelect";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCompanies, getDepartments, getPositions } from "@/lib/api";

interface FilterSectionProps {
  selectedCompanies: string[];
  setSelectedCompanies: (companies: string[]) => void;
  selectedDepartments: string[];
  setSelectedDepartments: (departments: string[]) => void;
  selectedPositions: string[];
  setSelectedPositions: (positions: string[]) => void;
  onFilterComplete: () => void;
}

// Dynamic option states will be populated via API

interface CompanyOption { id: string; name: string }
interface DepartmentOption { id: string; name: string; companyId: string }
interface PositionOption { id: string; title: string; departmentIds: string[] }

export const FilterSection = ({
  selectedCompanies,
  setSelectedCompanies,
  selectedDepartments,
  setSelectedDepartments,
  selectedPositions,
  setSelectedPositions,
  onFilterComplete
}: FilterSectionProps) => {
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [positionOptions, setPositionOptions] = useState<PositionOption[]>([]);

  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // === Load companies on mount ===
  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const res = await getCompanies();
        if (res.success && Array.isArray(res.data)) {
          setCompanyOptions(res.data as any);
        }
      } catch (error) {
        console.error('Failed to load companies', error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, []);

  // === Load departments when companies change ===
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedCompanies.length === 0) {
        setDepartmentOptions([]);
        return;
      }
      setIsLoadingDepartments(true);
      try {
        const allDeps: DepartmentOption[] = [];
        for (const companyName of selectedCompanies) {
          const company = companyOptions.find(c => c.name === companyName);
          if (!company) continue;
          const deps = await getDepartments(company.id);
          if (Array.isArray(deps)) {
            allDeps.push(...(deps as any));
          }
        }
        setDepartmentOptions(allDeps);
      } catch (error) {
        console.error('Failed to load departments', error);
      } finally {
        setIsLoadingDepartments(false);
      }
    };

    loadDepartments();
    // Clear downstream selections when company changes
    setSelectedDepartments([]);
    setSelectedPositions([]);
  }, [selectedCompanies]);

  // === Load positions when departments change ===
  useEffect(() => {
    const loadPositions = async () => {
      if (selectedDepartments.length === 0) {
        setPositionOptions([]);
        return;
      }
      setIsLoadingPositions(true);
      try {
        const allPositions: PositionOption[] = [];
        for (const deptName of selectedDepartments) {
          const dept = departmentOptions.find(d => d.name === deptName);
          if (!dept) continue;
          const positions = await getPositions(dept.id);
          if (Array.isArray(positions)) {
            allPositions.push(...(positions as any));
          }
        }
        setPositionOptions(allPositions);
      } catch (error) {
        console.error('Failed to load positions', error);
      } finally {
        setIsLoadingPositions(false);
      }
    };

    loadPositions();
    setSelectedPositions([]);
  }, [selectedDepartments]);

  // Ensure unique values to avoid duplicate keys in lists
  const availableCompanies = Array.from(new Set(companyOptions.map(c => c.name)));
  const availableDepartments = Array.from(new Set(departmentOptions.map(d => d.name)));
  const availablePositions = Array.from(new Set(positionOptions.map(p => p.title)));

  const handleSearch = () => {
    onFilterComplete();
  };

  const clearAllFilters = () => {
    setSelectedCompanies([]);
    setSelectedDepartments([]);
    setSelectedPositions([]);
  };

  const hasActiveFilters = selectedCompanies.length > 0 || selectedDepartments.length > 0 || selectedPositions.length > 0;

  return (
    <section id="filter-section" className="relative py-16 px-6 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Subtle background decoration - same as hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Find Your Perfect Role
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Use our intelligent filters to discover opportunities that match your skills and aspirations
          </p>
        </div>
        
        <div className="mb-8 flex flex-wrap justify-center gap-4">
          <Button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg font-medium"
            size="lg"
          >
            <Search className="mr-2 h-5 w-5" />
            Search Positions
          </Button>
          
          {hasActiveFilters && (
            <Button 
              onClick={clearAllFilters}
              variant="outline"
              className="border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 px-6 py-6 rounded-xl text-lg font-medium"
              size="lg"
            >
              <X className="mr-2 h-5 w-5" />
              Clear All Filters
            </Button>
          )}
        </div>

        <Card className="border shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center mb-6">
              <Filter className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-800">Filter Options</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Companies
                </label>
                <MultiSelect
                  options={availableCompanies}
                  selected={selectedCompanies}
                  onChange={setSelectedCompanies}
                  placeholder={isLoadingCompanies ? 'Loading...' : 'Choose companies...'}
                  disabled={isLoadingCompanies}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Departments
                </label>
                <MultiSelect
                  options={availableDepartments}
                  selected={selectedDepartments}
                  onChange={setSelectedDepartments}
                  placeholder={isLoadingDepartments ? 'Loading...' : 'Choose departments...'}
                  disabled={selectedCompanies.length === 0 || isLoadingDepartments}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Positions
                </label>
                <MultiSelect
                  options={availablePositions}
                  selected={selectedPositions}
                  onChange={setSelectedPositions}
                  placeholder={isLoadingPositions ? 'Loading...' : 'Choose positions...'}
                  disabled={selectedDepartments.length === 0 || isLoadingPositions}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
