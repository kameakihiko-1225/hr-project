import { useState, useEffect } from "react";
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
import { TopPositionsSection } from "@/components/TopPositionsSection";
import { AllPositionsSection } from "@/components/AllPositionsSection";

const Index = () => {
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Handle company selection changes
  const handleCompanyChange = (companies: string[]) => {
    setSelectedCompanies(companies);
    
    // If companies are deselected, also clear departments and positions
    if (companies.length === 0) {
      setSelectedDepartments([]);
      setSelectedPositions([]);
    }
  };
  
  // Handle department selection changes
  const handleDepartmentChange = (departments: string[]) => {
    setSelectedDepartments(departments);
    
    // If departments are deselected, also clear positions
    if (departments.length === 0) {
      setSelectedPositions([]);
    }
  };
  
  // Handle position selection changes
  const handlePositionChange = (positions: string[]) => {
    setSelectedPositions(positions);
  };
  
  // Handle search/filter completion
  const handleFilterComplete = () => {
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <TopPositionsSection />
      <AllPositionsSection />
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

      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
