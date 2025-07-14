import { useState, useEffect } from "react";
import { ArrowRight, Users, Building, Briefcase, TrendingUp, CheckCircle, Award, Globe, Bot, Code, Database, Palette, LineChart, Brain, ShieldCheck, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getPositions, getDepartments, getCandidates } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Define profession data
const professionData = [
  { 
    name: "Software Engineers", 
    icon: Code, 
    positions: 24, 
    applicants: 342,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    progressBg: "bg-blue-100",
    progressIndicator: "bg-blue-500"
  },
  { 
    name: "Data Analysts", 
    icon: Database, 
    positions: 18, 
    applicants: 256,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    progressBg: "bg-green-100",
    progressIndicator: "bg-green-500"
  },
  { 
    name: "UI/UX Designers", 
    icon: Palette, 
    positions: 12, 
    applicants: 198,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    progressBg: "bg-purple-100",
    progressIndicator: "bg-purple-500"
  },
  { 
    name: "AI Specialists", 
    icon: Brain, 
    positions: 15, 
    applicants: 287,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    progressBg: "bg-amber-100",
    progressIndicator: "bg-amber-500"
  }
];

// Placeholder data for department statistics to avoid undefined variable errors
const departmentStats = [
  { name: "Engineering" },
  { name: "Human Resources" },
  { name: "Marketing" },
  { name: "Finance" }
];

// Add types for profession and department stats
interface ProfessionStat {
  name: string;
  positions: number;
  applicants: number;
  progressIndicator: string;
}
interface DepartmentStat {
  name: string;
  applicants: number;
}

export const HeroSection = () => {
  // State for real-time data
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const [isCompact, setIsCompact] = useState(isMobile);
  const { t } = useTranslation();

  // Keep compact mode in sync with breakpoint
  useEffect(() => setIsCompact(isMobile), [isMobile]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [positionsData, departmentsData, candidatesData] = await Promise.all([
          getPositions(),
          getDepartments(undefined, true),
          getCandidates()
        ]);
        setPositions(Array.isArray(positionsData) ? positionsData : []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        setCandidates(Array.isArray(candidatesData) ? candidatesData : []);
      } catch (err) {
        setPositions([]);
        setDepartments([]);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Group positions by profession/title
  const professionMap = {};
  positions.forEach(pos => {
    const key = pos.title || 'Other';
    if (!professionMap[key]) professionMap[key] = { positions: 0, applicants: 0 };
    professionMap[key].positions += 1;
  });
  // Count applicants per profession (by position title)
  candidates.forEach(cand => {
    const pos = positions.find(p => p.id === cand.positionId);
    const key = pos?.title || 'Other';
    if (!professionMap[key]) professionMap[key] = { positions: 0, applicants: 0 };
    professionMap[key].applicants += 1;
  });
  const professionData: ProfessionStat[] = Object.entries(professionMap).map(([name, stats]) => ({
    name,
    positions: (stats as any).positions,
    applicants: (stats as any).applicants,
    progressIndicator: 'bg-blue-500',
  }));

  // Group applicants by department
  const departmentMap = {};
  departments.forEach(dept => {
    departmentMap[dept.id] = { name: dept.name, applicants: 0 };
  });
  candidates.forEach(cand => {
    if (cand.departmentId && departmentMap[cand.departmentId]) {
      departmentMap[cand.departmentId].applicants += 1;
    }
  });
  const departmentStats: DepartmentStat[] = Object.values(departmentMap);

  // Function to scroll to a section by ID
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Render a compact horizontal profession card
  const renderCompactProfession = (profession: any, index: number) => (
    <div key={profession.name} className="bg-white p-3 rounded-lg shadow border border-gray-100 flex items-center gap-3">
      <Avatar className={`h-8 w-8 ${profession.iconBg} ${profession.iconColor}`}>
        <profession.icon className="h-4 w-4" />
        <AvatarFallback>{profession.name[0]}</AvatarFallback>
      </Avatar>
      
      <div className="flex-grow min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-gray-800 truncate">{profession.name}</span>
          <span className="text-xs text-gray-500">{profession.positions} pos.</span>
        </div>
        <div className="relative h-1.5 w-full mt-1 overflow-hidden rounded-full bg-gray-100">
          <div 
            className={`h-full ${profession.progressIndicator} transition-all`}
            style={{ width: `${(profession.positions / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );

  // Render a compact horizontal department card
  const renderCompactDepartment = (dept: any, index: number) => {
    const applicantCount = Math.floor(Math.random() * 150) + 50; // Random applicant count between 50-200
    return (
      <div key={dept.name} className="bg-white p-3 rounded-lg shadow border border-gray-100 flex items-center gap-3">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center bg-indigo-100 text-indigo-600`}>
          <Users className="h-4 w-4" />
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm text-gray-800 truncate">{dept.name}</span>
            <span className="text-xs text-blue-600">{applicantCount}</span>
          </div>
          <div className="relative h-1.5 w-full mt-1 overflow-hidden rounded-full bg-gray-100">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-500 h-1.5 rounded-full transition-all"
              style={{ width: `${Math.min((applicantCount / 200) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="hero-section" className="relative bg-gradient-to-br from-blue-600/20 via-white to-[#1D4ED8]/20 py-12 md:py-16 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5">
        <div className="w-full h-full bg-gradient-to-l from-blue-600/20 to-transparent"></div>
      </div>
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-12 h-12 bg-indigo-100 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Content */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mb-4">
              <Briefcase className="h-4 w-4 mr-1.5" />
              {t('hero_badge')}
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              {t('hero_title_start')}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 block">
                {t('hero_title_highlight')}
              </span>
            </h1>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed max-w-lg">
              {t('hero_subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <button 
                onClick={() => scrollToSection("filter-section")}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600/90 hover:to-indigo-700 transition-all duration-300 flex items-center justify-center group shadow-md"
              >
                {t('hero_cta')}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                {t('hero_trust1')}
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                {t('hero_trust2')}
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
                {t('hero_trust3')}
              </div>
            </div>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-xl shadow border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-600 rounded-lg flex items-center justify-center mb-3">
                  <Briefcase className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">
                  {loading ? <Skeleton className="h-7 w-14" /> : positions.length}
                </h4>
                <p className="text-sm text-gray-600">Open Positions</p>
                <div className="mt-1 text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Fresh opportunities
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl shadow border border-gray-100 hover:shadow-md transition-all duration-300">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-3">
                  <Building className="h-5 w-5 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">
                  {loading ? <Skeleton className="h-7 w-14" /> : departments.length}
                </h4>
                <p className="text-sm text-gray-600">Partner Companies</p>
                <div className="mt-1 text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Nationwide impact
                </div>
              </div>
            </div>

            {/* Toggle button for mobile */}
            {isMobile && (
              <div className="mb-4 flex justify-center">
                <button 
                  onClick={() => setIsCompact(!isCompact)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {isCompact ? t('toggle_detailed') : t('toggle_compact')}
                </button>
              </div>
            )}

            {/* Profession-based Counters */}
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                <Briefcase className="h-4 w-4 mr-1.5 text-blue-600" />
                Positions by Profession
              </h3>
              
              {isCompact ? (
                <div className="space-y-2">
                  {professionData.map((profession, index) => renderCompactProfession(profession, index))}
                </div>
              ) : (
                <Card className="border-0 shadow">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {professionData.map((profession) => (
                        <div key={profession.name} className="group">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8 bg-blue-100 text-blue-600 mr-2">
                                <Briefcase className="h-4 w-4" />
                                <AvatarFallback>{profession.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="font-medium text-sm text-gray-800">{profession.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="outline" className="bg-white text-xs py-0 px-1.5">
                                    {profession.positions} positions
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs py-0 px-1.5">
                                    {profession.applicants} applicants
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {Math.round(profession.applicants / profession.positions)} per position
                            </div>
                          </div>
                          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 group-hover:bg-gray-200 transition-colors">
                            <div 
                              className={`h-full ${profession.progressIndicator} transition-all`}
                              style={{ width: `${(profession.positions / 30) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Applicants by Department */}
            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-1.5 text-indigo-600" />
                Applicants by Department
              </h3>
              
              {isCompact ? (
                <div className="space-y-2">
                  {departmentStats.slice(0, 4).map((dept, index) => renderCompactDepartment(dept, index))}
                </div>
              ) : (
                <div className="bg-white p-4 rounded-xl shadow border border-gray-100">
                  <div className="space-y-3">
                    {departmentStats.slice(0, 4).map((dept, index) => {
                      const applicantCount = Math.floor(Math.random() * 150) + 50; // Random applicant count between 50-200
                      return (
                        <div key={dept.name} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 text-sm font-medium">{dept.name}</span>
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                              {applicantCount} applicants
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-blue-600 to-indigo-500 h-1.5 rounded-full transition-all duration-1000"
                              style={{ width: `${Math.min((applicantCount / 200) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
