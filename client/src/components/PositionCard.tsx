// This file contains the clean implementation without merge conflicts

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Building2, Calendar, Users, Briefcase, ArrowUpRight, Loader2, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { getLocalizedContent, type LocalizedContent } from "@shared/schema";
import { CompanyInfoModal } from "@/components/CompanyInfoModal";
import { DepartmentInfoModal } from "@/components/DepartmentInfoModal";
import type { 
  positions,
  companies,
  departments
} from "@shared/schema";

type SelectPosition = typeof positions.$inferSelect;
type SelectCompany = typeof companies.$inferSelect;
type SelectDepartment = typeof departments.$inferSelect;

interface PositionCardProps {
  position: SelectPosition & {
    company?: SelectCompany | null;
    department?: SelectDepartment | null;
  };
  companyFromAPI?: SelectCompany | null;
  departmentFromAPI?: SelectDepartment | null;
  onClick?: () => void;
  showApplyButton?: boolean;
  showCardInteraction?: boolean;
  applicantCount?: number;
  topTierBadge?: number;
}

export function PositionCard({ 
  position, 
  companyFromAPI, 
  departmentFromAPI,
  onClick, 
  showApplyButton = true, 
  showCardInteraction = true,
  applicantCount = 0,
  topTierBadge = 0
}: PositionCardProps) {
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [isApplying, setIsApplying] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);

  // Helper to get company data - prioritize passed companyFromAPI over position.company
  const getCompanyData = () => companyFromAPI || position.company;
  const getDepartmentData = () => departmentFromAPI || position.department;

  const handleCardClick = (e: React.MouseEvent) => {
    if (!showCardInteraction) return;
    
    const target = e.target as HTMLElement;
    
    // Prevent card click when clicking interactive elements
    const isButton = target.tagName === 'BUTTON' || target.closest('button');
    const isLink = target.tagName === 'A' || target.closest('a');
    const isInput = target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA';
    
    if (isButton || isLink || isInput) {
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showCardInteraction) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) {
        onClick();
      }
    }
  };

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    // Check if there's an apply link configured
    if (position.applyLink) {
      const applyLinkUrl = getLocalizedContent(position.applyLink, i18n.language as 'en' | 'ru' | 'uz');
      console.log('Using language:', i18n.language);
      window.open(applyLinkUrl, '_blank', 'noopener,noreferrer');
      toast({ 
        title: 'Redirected to Application', 
        description: 'You\'ve been redirected to the application form.' 
      });
      return;
    }

    if (isApplying) return;

    try {
      setIsApplying(true);

      // For now, since we don't have bot functionality set up, show a simple message
      toast({ 
        title: 'Application Initiated', 
        description: `Thank you for your interest in the ${getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')} position! You will be contacted soon.` 
      });
      
      // In a real implementation, this would integrate with Telegram bot or other application system
      console.log(`Application submitted for position: ${getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')} (ID: ${position.id})`);
    } catch (error: any) {
      console.error('Apply via AI error:', error);
      toast({ title: 'Error', description: error?.message || 'Something went wrong' });
    } finally {
      setIsApplying(false);
    }
  };

  // Data inheritance logic: position -> department -> company
  const getInheritedData = () => {
    const basePosition = position;
    const department = getDepartmentData();
    const company = getCompanyData();

    // Helper to safely get localized content with fallback
    const safeGetLocalized = (content: string | LocalizedContent | undefined, fallback: string = '') => {
      return content ? getLocalizedContent(content, i18n.language as 'en' | 'ru' | 'uz') : fallback;
    };

    return {
      // Logo: use company logo
      logoUrl: company?.logoUrl || null,
      
      // Location: use position location -> department location -> company location
      city: safeGetLocalized(
        basePosition.city || 
        (company?.city as string | LocalizedContent | undefined)
      ),
      
      country: safeGetLocalized(
        basePosition.country || 
        (company?.country as string | LocalizedContent | undefined)
      ),
      
      // Company info
      companyName: safeGetLocalized(company?.name as string | LocalizedContent | undefined, 'Company'),
      companyColor: company?.color || '#b69b83',
      
      // Department info
      departmentName: safeGetLocalized(department?.name as string | LocalizedContent | undefined, 'Department'),
      
      // Description inheritance
      description: safeGetLocalized(
        basePosition.description || 
        (department?.description as string | LocalizedContent | undefined) || 
        (company?.description as string | LocalizedContent | undefined)
      )
    };
  };

  const inheritedData = getInheritedData();

  const formattedDate = formatDistanceToNow(
    typeof position.createdAt === 'string' ? new Date(position.createdAt) : position.createdAt || new Date(),
    { addSuffix: true }
  );

  // Avatar fallback to first letter of company name or default
  const logoFallback = inheritedData.companyName ? inheritedData.companyName.charAt(0).toUpperCase() : 'C';

  return (
    <>
    <Card className="group relative h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Top tier badge */}
      {topTierBadge > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-orange-500 text-white text-xs px-2 py-1 rounded-md font-medium">
            #{topTierBadge}
          </Badge>
        </div>
      )}

      {/* Applicant count badge */}
      {applicantCount > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <Badge variant="secondary" className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs px-2 py-1 rounded-md">
            <Users className="w-3 h-3 mr-1" />
            {applicantCount} applicants
          </Badge>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Company Logo */}
        <div className="flex justify-center">
          <Avatar className="w-16 h-16 border border-gray-200 dark:border-gray-700">
            <AvatarImage 
              src={inheritedData.logoUrl || undefined} 
              alt={`${inheritedData.companyName} logo`}
              className="object-cover"
            />
            <AvatarFallback 
              className="text-lg font-medium bg-gray-100 dark:bg-gray-800"
              style={{ backgroundColor: inheritedData.companyColor + '20', color: inheritedData.companyColor }}
            >
              {logoFallback}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Company Name */}
        <div className="text-center">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{inheritedData.companyName}</h4>
        </div>

        {/* Position Title */}
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')}
          </h3>
        </div>

        {/* Description */}
        {inheritedData.description && (
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 leading-relaxed">
            {inheritedData.description}
          </p>
        )}

        {/* Salary */}
        {position.salaryRange && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span>{getLocalizedContent(position.salaryRange, i18n.language as 'en' | 'ru' | 'uz')}</span>
          </div>
        )}

        {/* Location and Employment Type */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
          {(inheritedData.city || inheritedData.country) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{[inheritedData.city, inheritedData.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
          
          {position.employmentType && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              <span>{getLocalizedContent(position.employmentType, i18n.language as 'en' | 'ru' | 'uz')}</span>
            </div>
          )}
        </div>

        {/* Time posted */}
        <div className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Calendar className="w-3 h-3 mr-1" />
          <span>{formattedDate}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              setIsCompanyModalOpen(true);
            }}
          >
            <Building2 className="w-3 h-3 mr-1" />
            Kompaniya...
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              setIsDepartmentModalOpen(true);
            }}
          >
            <Building2 className="w-3 h-3 mr-1" />
            Bo'lim haq...
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
            onClick={(e) => {
              e.stopPropagation();
              if (onClick) onClick();
            }}
          >
            Batafsil
          </Button>
        </div>

        {/* Apply Button */}
        {showApplyButton && (
          <Button
            onClick={handleApplyClick}
            disabled={isApplying}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md transition-colors duration-200 font-medium"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('applying')}
              </>
            ) : (
              'Hozir ariza topshirish'
            )}
          </Button>
        )}
      </div>
    </Card>

    {/* Company Modal */}
    <CompanyInfoModal
      company={getCompanyData()}
      isOpen={isCompanyModalOpen}
      onClose={() => setIsCompanyModalOpen(false)}
    />

    {/* Department Modal */}
    <DepartmentInfoModal
      department={getDepartmentData()}
      company={getCompanyData()}
      isOpen={isDepartmentModalOpen}
      onClose={() => setIsDepartmentModalOpen(false)}
    />
  </>
  );
}