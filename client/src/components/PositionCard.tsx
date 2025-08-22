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
      } bg-gradient-to-br from-background to-background/80 border-border/50`}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={showCardInteraction ? 0 : -1}
      role={showCardInteraction ? "button" : undefined}
      aria-label={showCardInteraction ? `View details for ${getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')} position` : undefined}
    >
      {/* Top-right badges: tier and applicants */}
      {(topTierBadge > 0 || applicantCount > 0) && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {topTierBadge > 0 && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow ${topTierBadge === 1 ? 'bg-yellow-500' : topTierBadge === 2 ? 'bg-gray-500' : 'bg-amber-700'}`}>#{topTierBadge}</span>
          )}
          {applicantCount > 0 && (
            <Badge variant="outline" className="bg-white/90 text-foreground border-gray-300 shadow-sm text-xs">
              <Users className="w-3 h-3 mr-1" />
              {applicantCount} {applicantCount === 1 ? 'applicant' : 'applicants'}
            </Badge>
          )}
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">
              {inheritedData.companyName}
            </div>
            <h3 className="mt-1 font-semibold text-base sm:text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
              {getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')}
            </h3>
            {inheritedData.departmentName && (
              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                <Building2 className="w-3 h-3" />
                <span className="truncate">{inheritedData.departmentName}</span>
              </div>
            )}
          </div>
          
          <Avatar className="w-12 h-12 rounded-full ring-1 ring-gray-200 bg-white/80 shadow-sm flex-shrink-0 overflow-hidden">
            <AvatarImage 
              src={inheritedData.logoUrl || undefined} 
              alt={`${inheritedData.companyName} logo`}
              className="object-cover"
            />
            <AvatarFallback 
              className="text-sm font-medium"
              style={{ backgroundColor: inheritedData.companyColor + '20', color: inheritedData.companyColor }}
            >
              {logoFallback}
            </AvatarFallback>
          </Avatar>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {inheritedData.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
            {inheritedData.description}
          </p>
        )}
        
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {(inheritedData.city || inheritedData.country) && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {[inheritedData.city, inheritedData.country].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>
          
          {position.employmentType && (
            <div className="flex items-center gap-1">
              <Briefcase className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{getLocalizedContent(position.employmentType, i18n.language as 'en' | 'ru' | 'uz')}</span>
            </div>
          )}
        </div>
      </CardContent>

      {showApplyButton && (
        <CardFooter className="pt-0">
          <Button
            onClick={handleApplyClick}
            disabled={isApplying}
            className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
            size="sm"
          >
            {isApplying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('applying')}
              </>
            ) : (
              <>
                {t('apply')}
                <ArrowUpRight className="w-4 h-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}