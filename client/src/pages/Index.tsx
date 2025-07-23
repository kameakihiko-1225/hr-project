import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { FounderSection } from "@/components/FounderSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { StatsSection } from "@/components/StatsSection";
import { CompanyCarousel } from "@/components/CompanyCarousel";
import { CTASection } from "@/components/CTASection";
import { FilterSection } from "@/components/FilterSection";
import { OpenPositions } from "@/components/OpenPositions";
import SEOHead from "@/components/SEOHead";
import { getPageSEO } from "@/utils/seoUtils";
import VoiceSearchOptimization from "@/components/VoiceSearchOptimization";
import { SEOResourcePrefetch, useWebVitals } from "@/components/PerformanceOptimizations";
import { AdvancedSEO, getHomepageStructuredData } from "@/components/AdvancedSEO";
import { TopSearchRankingOptimization } from "@/components/TopSearchRankingOptimization";
import AdvancedJobSEO from "@/components/AdvancedJobSEO";

const Index = () => {
  const { i18n } = useTranslation();
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<number[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<number[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [positions, setPositions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  const seoData = getPageSEO('home', i18n.language);
  
  // Initialize performance optimizations
  useWebVitals();
  
  // Fetch data for SEO optimization
  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        const [positionsRes, companiesRes, departmentsRes] = await Promise.all([
          fetch(`/api/positions?language=${i18n.language}`),
          fetch(`/api/companies?language=${i18n.language}`),
          fetch(`/api/departments?language=${i18n.language}`)
        ]);
        
        if (positionsRes.ok) {
          const posData = await positionsRes.json();
          setPositions(posData.data || []);
        }
        
        if (companiesRes.ok) {
          const compData = await companiesRes.json();
          setCompanies(compData.data || []);
        }
        
        if (departmentsRes.ok) {
          const deptData = await departmentsRes.json();
          setDepartments(deptData.data || []);
        }
      } catch (error) {
        console.error('Error fetching SEO data:', error);
      }
    };
    
    fetchSEOData();
  }, [i18n.language]);
  
  // Handle company selection changes
  const handleCompanyChange = (companies: number[]) => {
    setSelectedCompanies(companies);
    
    // If companies are deselected, also clear departments and positions
    if (companies.length === 0) {
      setSelectedDepartments([]);
      setSelectedPositions([]);
    }
  };
  
  // Handle department selection changes
  const handleDepartmentChange = (departments: number[]) => {
    setSelectedDepartments(departments);
    
    // If departments are deselected, also clear positions
    if (departments.length === 0) {
      setSelectedPositions([]);
    }
  };
  
  // Handle position selection changes
  const handlePositionChange = (positions: number[]) => {
    setSelectedPositions(positions);
  };
  
  // Handle search/filter completion
  const handleFilterComplete = () => {
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <AdvancedSEO 
        title="Millat Umidi HR - Top Jobs in Central Asia | Kazakhstan Uzbekistan Kyrgyzstan"
        description="Find premium career opportunities at Millat Umidi Group. Leading educational and corporate positions in Central Asia. Join our growing team in Kazakhstan, Uzbekistan, and Kyrgyzstan."
        keywords="millat umidi jobs, central asia careers, uzbekistan jobs, kazakhstan employment, kyrgyzstan vacancies, hr positions, educational jobs, corporate careers, tashkent jobs, almaty careers"
        canonicalUrl="https://career.millatumidi.uz"
        structuredData={getHomepageStructuredData()}
      />
      <TopSearchRankingOptimization />
      <SEOHead 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical={seoData.canonical}
        type="website"
      />
      <Header />
      <HeroSection />
      <FounderSection />
      <CompanyCarousel />
      <FeaturesSection />
      <StatsSection />
      <FilterSection 
        selectedCompanies={selectedCompanies}
        setSelectedCompanies={handleCompanyChange}
        selectedDepartments={selectedDepartments}
        setSelectedDepartments={handleDepartmentChange}
        selectedPositions={selectedPositions}
        setSelectedPositions={handlePositionChange}
        onFilterComplete={handleFilterComplete}
      />
      <OpenPositions 
        selectedCompanies={selectedCompanies}
        selectedDepartments={selectedDepartments}
        selectedPositions={selectedPositions}
        hasSearched={hasSearched}
      />

      {/* <CTASection /> */}
      <Footer />
      
      {/* SEO and Performance Components */}
      <AdvancedJobSEO 
        positions={positions}
        companies={companies}
        departments={departments}
      />
      <VoiceSearchOptimization />
      <SEOResourcePrefetch />
    </div>
  );
};

export default Index;
