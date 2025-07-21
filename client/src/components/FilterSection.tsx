import { useState, useEffect } from "react";
import { MultiSelect } from "@/components/MultiSelect";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { getCompanies, getDepartments, getPositions } from "@/lib/api";
import { useTranslation } from 'react-i18next';
import { getLocalizedContent } from "@shared/schema";

interface FilterSectionProps {
  selectedCompanies: number[];
  setSelectedCompanies: (companies: number[]) => void;
  selectedDepartments: number[];
  setSelectedDepartments: (departments: number[]) => void;
  selectedPositions: number[];
  setSelectedPositions: (positions: number[]) => void;
  onFilterComplete: () => void;
}

// Dynamic option states will be populated via API

interface CompanyOption { id: number; name: any; }
interface DepartmentOption { id: number; name: any; companyId: number; }
interface PositionOption { id: number; title: any; departmentId: number; }

export const FilterSection = ({
  selectedCompanies,
  setSelectedCompanies,
  selectedDepartments,
  setSelectedDepartments,
  selectedPositions,
  setSelectedPositions,
  onFilterComplete
}: FilterSectionProps) => {
  const { t, i18n } = useTranslation();
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [positionOptions, setPositionOptions] = useState<PositionOption[]>([]);

  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);
  const [isLoadingPositions, setIsLoadingPositions] = useState(false);

  // === Load companies on mount and language change ===
  useEffect(() => {
    const loadCompanies = async () => {
      setIsLoadingCompanies(true);
      try {
        const res = await getCompanies();
        if (res.data && Array.isArray(res.data)) {
          setCompanyOptions(res.data as any);
        }
      } catch (error) {
        console.error('Failed to load companies', error);
      } finally {
        setIsLoadingCompanies(false);
      }
    };
    loadCompanies();
  }, [i18n.language]);

  // === Load departments when companies change ===
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedCompanies.length === 0) {
        setDepartmentOptions([]);
        return;
      }
      setIsLoadingDepartments(true);
      try {
        const deps = await getDepartments();
        const allDeps = Array.isArray(deps) ? deps : deps?.data || [];
        // Filter departments that belong to selected companies
        const filteredDeps = allDeps.filter((dep: any) => 
          selectedCompanies.includes(dep.companyId)
        );
        setDepartmentOptions(filteredDeps);
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
  }, [selectedCompanies, i18n.language]);

  // === Load positions when departments change ===
  useEffect(() => {
    const loadPositions = async () => {
      if (selectedDepartments.length === 0) {
        setPositionOptions([]);
        return;
      }
      setIsLoadingPositions(true);
      try {
        const positions = await getPositions();
        const allPositions = Array.isArray(positions) ? positions : positions?.data || [];
        // Filter positions that belong to selected departments
        const filteredPositions = allPositions.filter((pos: any) => 
          selectedDepartments.includes(pos.departmentId)
        );
        setPositionOptions(filteredPositions);
      } catch (error) {
        console.error('Failed to load positions', error);
      } finally {
        setIsLoadingPositions(false);
      }
    };

    loadPositions();
    setSelectedPositions([]);
  }, [selectedDepartments, i18n.language]);

  // Create display arrays with ID-name pairs for MultiSelect
  const availableCompanies = companyOptions.map(c => ({
    id: c.id.toString(),
    name: getLocalizedContent(c.name, i18n.language as "en" | "ru" | "uz")
  }));
  
  const availableDepartments = departmentOptions.map(d => ({
    id: d.id.toString(),
    name: getLocalizedContent(d.name, i18n.language as "en" | "ru" | "uz")
  }));
  
  const availablePositions = positionOptions.map(p => ({
    id: p.id.toString(),
    name: getLocalizedContent(p.title, i18n.language as "en" | "ru" | "uz")
  }));

  // Debug logging 
  console.log('FilterSection Company Options:', availableCompanies);
  console.log('Selected Company IDs:', selectedCompanies);

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
    <section id="filter-section" className="relative py-8 sm:py-12 md:py-16 px-3 sm:px-4 md:px-6 bg-white dark:bg-gray-950 overflow-visible z-10">
      {/* Subtle background decoration - same as hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-6 sm:mb-8 md:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6 px-2">
            {t('filter.title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 sm:px-4">
            {t('filter.subtitle')}
          </p>
        </div>
        
        <div className="mb-6 sm:mb-8 flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-2">
          <Button 
            onClick={handleSearch}
            className="bg-blue-600 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 text-white px-4 sm:px-6 md:px-8 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-medium transition-all duration-300 flex-1 sm:flex-initial min-w-0"
            size="default"
          >
            <Search className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            <span className="truncate">{t('filter.search_positions')}</span>
          </Button>
          
          {hasActiveFilters && (
            <Button 
              onClick={clearAllFilters}
              variant="outline"
              className="border-red-300 hover:bg-red-50 hover:shadow-xl hover:shadow-red-100 hover:-translate-y-1 text-red-600 hover:text-red-700 px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 rounded-lg sm:rounded-xl text-sm sm:text-base md:text-lg font-medium transition-all duration-300"
              size="default"
            >
              <X className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Clear All Filters</span>
              <span className="xs:hidden">Clear</span>
            </Button>
          )}
        </div>

        <Card className="border shadow-md mx-2 sm:mx-0">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center mb-4 sm:mb-6">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mr-2" />
              <h3 className="text-base sm:text-lg font-medium text-gray-800">{t('filter.filter_options')}</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  {t('filter.labels.companies')}
                </label>
                <MultiSelect
                  options={availableCompanies.map(c => c.name)}
                  selected={selectedCompanies.map(id => 
                    availableCompanies.find(c => c.id === id.toString())?.name || ''
                  ).filter(Boolean)}
                  onChange={(names) => {
                    const ids = names.map(name => {
                      const company = availableCompanies.find(c => c.name === name);
                      return company ? parseInt(company.id) : null;
                    }).filter(id => id !== null) as number[];
                    setSelectedCompanies(ids);
                  }}
                  placeholder={isLoadingCompanies ? t('filter.placeholders.loading') : t('filter.placeholders.companies')}
                  disabled={isLoadingCompanies}
                />
              </div>

              <div className="space-y-2 sm:space-y-3">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  {t('filter.labels.departments')}
                </label>
                <MultiSelect
                  options={availableDepartments.map(d => d.name)}
                  selected={selectedDepartments.map(id => 
                    availableDepartments.find(d => d.id === id.toString())?.name || ''
                  ).filter(Boolean)}
                  onChange={(names) => {
                    const ids = names.map(name => {
                      const department = availableDepartments.find(d => d.name === name);
                      return department ? parseInt(department.id) : null;
                    }).filter(id => id !== null) as number[];
                    setSelectedDepartments(ids);
                  }}
                  placeholder={isLoadingDepartments ? t('filter.placeholders.loading') : t('filter.placeholders.departments')}
                  disabled={selectedCompanies.length === 0 || isLoadingDepartments}
                />
              </div>

              <div className="space-y-2 sm:space-y-3 sm:col-span-2 lg:col-span-1">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  {t('filter.labels.positions')}
                </label>
                <MultiSelect
                  options={availablePositions.map(p => p.name)}
                  selected={selectedPositions.map(id => 
                    availablePositions.find(p => p.id === id.toString())?.name || ''
                  ).filter(Boolean)}
                  onChange={(names) => {
                    const ids = names.map(name => {
                      const position = availablePositions.find(p => p.name === name);
                      return position ? parseInt(position.id) : null;
                    }).filter(id => id !== null) as number[];
                    setSelectedPositions(ids);
                  }}
                  placeholder={isLoadingPositions ? t('filter.placeholders.loading') : t('filter.placeholders.positions')}
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
