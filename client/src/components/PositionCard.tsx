// This file contains the clean implementation without merge conflicts

import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Building2, Calendar, Users, Briefcase, ArrowUpRight, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { getLocalizedContent, type LocalizedContent } from "@shared/schema";
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
    <Card 
      className={`group relative h-full transition-all duration-300 hover:shadow-lg hover:border-primary/20 ${
        showCardInteraction ? 'cursor-pointer' : ''
      } bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={showCardInteraction ? 0 : -1}
      role={showCardInteraction ? "button" : undefined}
      aria-label={showCardInteraction ? `View details for ${getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')} position` : undefined}
    >
      {/* Applicant count badge */}
      {applicantCount > 0 && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="outline" className="bg-gray-50 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600">
            <Users className="w-3 h-3 mr-1" />
            {applicantCount} {applicantCount === 1 ? 'applicant' : 'applicants'}
          </Badge>
        </div>
      )}

      {/* Top tier badge */}
      {topTierBadge > 0 && (
        <div className="absolute top-3 right-3 z-10">
          <Badge 
            className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100 px-2 py-1 text-xs font-medium shadow-sm"
          >
            🏆 Top Tier
          </Badge>
        </div>
      )}

      <CardContent className="p-4">
        {/* Position Title */}
        <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-1 line-clamp-2">
          {getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')}
        </h3>

        {/* Company and Department Info */}
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
          <Building2 className="w-4 h-4" />
          <span>{inheritedData.companyName}</span>
          {inheritedData.departmentName && (
            <>
              <span>•</span>
              <span>{inheritedData.departmentName}</span>
            </>
          )}
        </div>

        {/* Description */}
        {inheritedData.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {inheritedData.description}
          </p>
        )}

        {/* Location and other details */}
        <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
          {(inheritedData.city || inheritedData.country) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{[inheritedData.city, inheritedData.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
          
          {position.employmentType && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              <span>{getLocalizedContent(position.employmentType, i18n.language as 'en' | 'ru' | 'uz')}</span>
            </div>
          )}
        </div>

        {/* Apply Button */}
        {showApplyButton && (
          <Button
            onClick={handleApplyClick}
            disabled={isApplying}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
            size="sm"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('applying')}
              </>
            ) : (
              <>
                apply
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        )}

        {/* Company Avatar in bottom right corner */}
        <div className="absolute bottom-4 right-4">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white"
            style={{ backgroundColor: inheritedData.companyColor || '#b69b83' }}
          >
            {logoFallback}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}