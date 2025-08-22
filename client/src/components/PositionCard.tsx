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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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
    <Card 
      className="relative w-full max-w-sm mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={showCardInteraction ? 0 : -1}
    >
      {/* Header with badges */}
      <div className="relative p-4 pb-2">
        {/* Top tier badge */}
        {topTierBadge > 0 && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-gradient-to-r from-orange-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
              ⭐ #{topTierBadge}
            </Badge>
          </div>
        )}

        {/* Applicant count badge */}
        {applicantCount > 0 && (
          <div className="absolute top-3 right-3 z-10">
            <Badge className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full font-medium">
              <Users className="w-3 h-3 mr-1" />
              {applicantCount} {t('applicants')}
            </Badge>
          </div>
        )}

        {/* Company Logo */}
        <div className="flex justify-start mt-8">
          <Avatar className="w-12 h-12 border border-gray-200">
            <AvatarImage 
              src={inheritedData.logoUrl || undefined} 
              alt={`${inheritedData.companyName} logo`}
              className="object-contain p-1"
            />
            <AvatarFallback 
              className="text-sm font-medium bg-gray-100"
              style={{ backgroundColor: inheritedData.companyColor + '20', color: inheritedData.companyColor }}
            >
              {logoFallback}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 space-y-3">
        {/* Company Name */}
        <h4 className="text-lg font-semibold text-gray-900 leading-tight">
          {inheritedData.companyName}
        </h4>

        {/* Position Title */}
        <h3 className="text-xl font-bold text-gray-900 leading-tight">
          {getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
          {inheritedData.description || getLocalizedContent(position.description, i18n.language as 'en' | 'ru' | 'uz')}
        </p>

        {/* Salary */}
        {position.salaryRange && (
          <div className="flex items-center gap-1 text-sm text-gray-700">
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">{getLocalizedContent(position.salaryRange, i18n.language as 'en' | 'ru' | 'uz')}</span>
          </div>
        )}

        {/* Location and Employment Type */}
        <div className="flex items-center gap-4 text-sm text-gray-500">
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
        <div className="flex items-center justify-center text-xs text-gray-500 pt-2 border-t border-gray-100">
          <Calendar className="w-3 h-3 mr-1" />
          <span>about {formattedDate}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8 border-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setIsCompanyModalOpen(true);
            }}
          >
            <Building2 className="w-3 h-3 mr-1" />
            {t('company_info')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8 border-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setIsDepartmentModalOpen(true);
            }}
          >
            <Building2 className="w-3 h-3 mr-1" />
            {t('department_info')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8 border-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              setIsDetailsModalOpen(true);
            }}
          >
            {t('position_details')}
          </Button>
        </div>

        {/* Apply Button */}
        {showApplyButton && (
          <Button
            onClick={handleApplyClick}
            disabled={isApplying}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium mt-3"
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
      company={getCompanyData() || null}
      isOpen={isCompanyModalOpen}
      onClose={() => setIsCompanyModalOpen(false)}
    />

    {/* Department Modal */}
    <DepartmentInfoModal
      department={getDepartmentData() || null}
      company={getCompanyData() || null}
      isOpen={isDepartmentModalOpen}
      onClose={() => setIsDepartmentModalOpen(false)}
    />

    {/* Position Details Modal */}
    <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {inheritedData.logoUrl && (
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={inheritedData.logoUrl} 
                  alt={`${inheritedData.companyName} logo`}
                  className="object-contain p-1"
                />
                <AvatarFallback>{logoFallback}</AvatarFallback>
              </Avatar>
            )}
            <div>
              <h2 className="text-xl font-bold">
                {getLocalizedContent(position.title, i18n.language as 'en' | 'ru' | 'uz')}
              </h2>
              <p className="text-sm text-muted-foreground">{inheritedData.companyName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Position Description */}
          <div>
            <h3 className="font-semibold mb-2">{t('job_description')}</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-line">
              {inheritedData.description || getLocalizedContent(position.description, i18n.language as 'en' | 'ru' | 'uz')}
            </p>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {position.salaryRange && (
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {t('salary')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {getLocalizedContent(position.salaryRange, i18n.language as 'en' | 'ru' | 'uz')}
                </p>
              </div>
            )}

            {position.employmentType && (
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {t('employment_type')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {getLocalizedContent(position.employmentType, i18n.language as 'en' | 'ru' | 'uz')}
                </p>
              </div>
            )}

            {(inheritedData.city || inheritedData.country) && (
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {t('location')}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {[inheritedData.city, inheritedData.country].filter(Boolean).join(', ')}
                </p>
              </div>
            )}

            <div>
              <h4 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('posted')}
              </h4>
              <p className="text-sm text-muted-foreground">{formattedDate}</p>
            </div>
          </div>

          {/* Apply Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleApplyClick}
              disabled={isApplying}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors duration-200 font-medium"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('applying')}
                </>
              ) : (
                t('apply_now')
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </>
  );
}