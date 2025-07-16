import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { 
  Building2, MapPin, Users, ExternalLink, AlertCircle, Search 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { API_BASE_URL } from "@/lib/api";

interface IndustryTag {
  id: number;
  name: string;
  description: string;
}

interface Company {
  id: number;
  name: string;
  description: string;
  logoUrl?: string;
  color?: string;
  address?: string;
  phone?: string;
  email?: string;
  city?: string;
  country?: string;
  industries: IndustryTag[];
}

const Companies = () => {
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchCompanies() {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_BASE_URL}/companies`);
        if (!response.ok) {
          throw new Error('Failed to fetch companies');
        }
        
        const data = await response.json();
        console.log('Companies API response:', data);
        
        if (data.success && data.data && Array.isArray(data.data)) {
          setCompanies(data.data);
          setFilteredCompanies(data.data);
        } else {
          console.log('No valid companies data received');
          setCompanies([]);
          setFilteredCompanies([]);
        }
      } catch (err) {
        console.error('Error fetching companies:', err);
        setError('Failed to load companies');
        setCompanies([]);
        setFilteredCompanies([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.industries.some(industry => 
          industry.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredCompanies(filtered);
    }
  }, [searchTerm, companies]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Skeleton className="h-10 w-64 mx-auto mb-4" />
              <Skeleton className="h-6 w-96 mx-auto" />
            </div>
            
            <div className="max-w-md mx-auto mb-12">
              <Skeleton className="h-12 w-full" />
            </div>
            
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                  <Skeleton className="h-16 w-16 mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-16 w-full mb-4" />
                  <Skeleton className="h-4 w-24 mx-auto mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header />
        
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />
      
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
                {t('positions_section.more_companies')}
              </h1>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover career opportunities across all companies in the Millat Umidi Group ecosystem
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-3 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Companies Grid */}
          <div className="max-w-6xl mx-auto">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm ? "No companies match your search" : "No companies available"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.id}
                    className="group bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/30"
                  >
                    <div className="flex flex-col h-full">
                      {/* Logo */}
                      <div className="flex justify-center mb-4">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={`${company.name} logo`}
                            className="h-16 w-16 object-contain rounded-lg"
                          />
                        ) : (
                          <div 
                            className="h-16 w-16 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: company.color || '#3B82F6' }}
                          >
                            <Building2 className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                      
                      {/* Company Name */}
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 text-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {company.name}
                      </h3>
                      
                      {/* Description */}
                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4 flex-grow">
                        {company.description}
                      </p>
                      
                      {/* Industry Tags */}
                      {company.industries && company.industries.length > 0 && (
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-2">
                            {company.industries.slice(0, 2).map((industry) => (
                              <span
                                key={industry.id}
                                className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                              >
                                {industry.name}
                              </span>
                            ))}
                            {company.industries.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                                +{company.industries.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Location */}
                      {(company.city || company.country) && (
                        <div className="flex items-center text-gray-600 dark:text-gray-400 text-sm mb-4">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{[company.city, company.country].filter(Boolean).join(', ')}</span>
                        </div>
                      )}
                      
                      {/* View Opportunities Button */}
                      <div className="mt-auto">
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-none transition-all duration-300 group-hover:shadow-lg"
                        >
                          <a href={`/positions?company=${company.id}`}>
                            <Users className="h-4 w-4 mr-2" />
                            <span>View Opportunities</span>
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Companies;