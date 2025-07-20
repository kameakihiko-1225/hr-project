import React, { useState, useEffect } from 'react';
import { Position } from '../types/position';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Pencil, Trash2, Building2, Briefcase, DollarSign, Clock, MapPin, Send, ExternalLink, Crown, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from '@/components/ui/use-toast';

import { getBotByAdminId, createCandidateDeepLink, createPositionDeepLink } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { createLogger } from '@/lib/logger';
import { useClickCounter } from '@/contexts/ClickCounterContext';
import { CompanyInfoModal } from './CompanyInfoModal';
import { DepartmentInfoModal } from './DepartmentInfoModal';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { LocalizedContent } from '@shared/schema';

const logger = createLogger('positionCard');

interface PositionCardProps {
  position: Position;
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  showDepartment?: boolean;
  applicantCount?: number;
  topTierBadge?: 1 | 2 | 3; // Badge for top 3 most applied positions
  compactMobile?: boolean; // Enable compact mobile view
}

export const PositionCard = React.memo(function PositionCard({ position, onEdit, onDelete, showDepartment = false, applicantCount, topTierBadge, compactMobile = false }: PositionCardProps) {
  const { t, i18n } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  // Authentication removed - no admin check needed
  const [isApplying, setIsApplying] = useState(false);
  const { incrementJobSeekers, incrementApplicants } = useClickCounter();
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  
  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  };

  // Track position view when card is first rendered
  useEffect(() => {
    if (!hasTrackedView) {
      const trackView = async () => {
        try {
          await fetch(`/api/positions/${position.id}/track-click`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clickType: 'view' }),
          });
          setHasTrackedView(true);
        } catch (error) {
          console.error('Failed to track position view:', error);
        }
      };
      trackView();
    }
  }, [position.id, hasTrackedView]);

  // Simplified data fetching with fresh company data
  const { data: companyData } = useQuery({
    queryKey: ['company', position.departmentId],
    queryFn: async () => {
      // First get department to find company ID
      const deptResponse = await fetch(`/api/departments/${position.departmentId}`);
      if (!deptResponse.ok) return null;
      const deptResult = await deptResponse.json();
      
      // Then get company data
      const companyResponse = await fetch(`/api/companies/${deptResult.data.companyId}`);
      if (!companyResponse.ok) return null;
      const companyResult = await companyResponse.json();
      
      return {
        department: deptResult.data,
        company: companyResult.data
      };
    },
    staleTime: 0, // Always fetch fresh data
    enabled: !!position.departmentId
  });
  
  const departmentFromAPI = companyData?.department;
  const companyFromAPI = companyData?.company;
  
  // Data loading is working correctly

  const handleEdit = () => {
    if (onEdit) {
      onEdit(position);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(position);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleLogoError = () => {
    logger.warn(`Failed to load logo for company: ${companyName}`);
    setLogoError(true);
  };

  const handleApply = async () => {
    // Track apply click in database
    try {
      await fetch(`/api/positions/${position.id}/track-click`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clickType: 'apply' }),
      });
    } catch (error) {
      console.error('Failed to track apply click:', error);
    }

    // Legacy increment for immediate UI feedback (these will be replaced by database counts)
    incrementJobSeekers();
    incrementApplicants();

    // Debug log to check position data
    console.log('Apply button clicked. Position data:', position);
    console.log('Apply link value:', position.applyLink);

    // If position has a direct apply link, use it
    if (position.applyLink) {
      const applyLinkUrl = getLocalizedContent(position.applyLink);
      console.log('Redirecting to custom apply link:', applyLinkUrl);
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
        description: `Thank you for your interest in the ${getLocalizedContent(position.title)} position! You will be contacted soon.` 
      });
      
      // In a real implementation, this would integrate with Telegram bot or other application system
      console.log(`Application submitted for position: ${getLocalizedContent(position.title)} (ID: ${position.id})`);
    } catch (error: any) {
      console.error('Apply via AI error:', error);
      toast({ title: 'Error', description: error?.message || 'Something went wrong' });
    } finally {
      setIsApplying(false);
    }
  };

  // Simplified data extraction
  const companyName = companyFromAPI?.name || 'Company';
  const postedAgo = position.createdAt ? formatDistanceToNow(new Date(position.createdAt), { addSuffix: true }) : '';

  // Simplified logo rendering
  const renderLogo = () => {
    const logoUrl = companyFromAPI?.logoUrl;
    const fallbackLetter = companyFromAPI?.name?.charAt(0) || 'C';
    
    return (
      <Avatar className="w-full h-full border-2 border-white/30 shadow-lg group-hover:shadow-xl group-hover:scale-105 transition-all duration-300">
        {logoUrl && !logoError ? (
          <AvatarImage 
            src={logoUrl} 
            alt={companyFromAPI?.name || 'Company'} 
            className="object-contain object-center w-full h-full p-1 sm:p-2"
            onError={() => setLogoError(true)}
          />
        ) : (
          <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold text-sm sm:text-lg shadow-inner">
            {fallbackLetter}
          </AvatarFallback>
        )}
      </Avatar>
    );
  };

  return (
    <Card
      tabIndex={0}
      role="button"
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleApply();
      }}
      className={`animate-fade-in group relative overflow-hidden border border-gray-100 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:shadow-lg hover:shadow-blue-100 hover:border-blue-200 hover:-translate-y-1 focus:-translate-y-1 transition-all duration-300 ${compactMobile ? 'h-[420px] sm:h-[440px]' : 'h-[400px] sm:h-[440px]'} w-full flex flex-col`}
    >
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

      {/* Top-tier badge and applicant count */}
      {(topTierBadge || applicantCount !== undefined) && (
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1 z-20">
          {topTierBadge && (
            <Badge 
              variant="secondary" 
              className={`text-white border-none shadow-lg font-semibold ${
                topTierBadge === 1 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' // Gold
                  : topTierBadge === 2 
                  ? 'bg-gradient-to-r from-gray-400 to-gray-600' // Silver  
                  : 'bg-gradient-to-r from-amber-600 to-amber-800' // Bronze
              }`}
            >
              <Crown className="h-3 w-3 mr-1" />
              #{topTierBadge}
            </Badge>
          )}
          {applicantCount !== undefined && (
            <Badge 
              variant="outline" 
              className="bg-white/95 text-gray-800 border-gray-300 shadow-sm text-sm font-medium px-2 py-1"
            >
              <Users className="h-4 w-4 mr-1" />
              {applicantCount} {applicantCount === 1 ? 'applicant' : 'applicants'}
            </Badge>
          )}
        </div>
      )}

      {/* Edit / Delete buttons */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 left-2 flex gap-1 z-20">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={handleEdit} className="h-7 w-7">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Position</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete the position "{getLocalizedContent(position.title)}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      <CardHeader className={`flex items-start gap-3 pb-2 ${compactMobile ? 'pt-2 sm:pt-3' : 'pt-3 sm:pt-4'} px-3 sm:px-6 relative z-10`}>
        <div className={`${compactMobile ? 'w-10 h-10 sm:w-14 sm:h-14' : 'w-12 h-12 sm:w-16 sm:h-16'}`}>
          {renderLogo()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm sm:text-base leading-tight text-foreground truncate">
            {companyName}
          </h3>
          {showDepartment && Array.isArray(position.departments) && position.departments.length > 0 && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              {position.departments.map((dp, idx) => (
                <span key={dp.department.id} className="flex items-center">
                  {getLocalizedContent(dp.department.name)}
                  {idx < position.departments.length - 1 && <span className="mx-1">|</span>}
                </span>
              ))}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className={`${compactMobile ? 'space-y-1' : 'space-y-2'} pb-2 px-3 sm:px-6 relative z-10 flex-1 flex flex-col`}>
        <CardTitle className={`${compactMobile ? 'text-sm sm:text-base' : 'text-base sm:text-lg'} font-semibold tracking-tight text-foreground group-hover:text-primary job-card-title line-clamp-2`}>
          {getLocalizedContent(position.title)}
        </CardTitle>

        {position.description && (
          <p className={`${compactMobile ? 'text-xs line-clamp-1' : 'text-xs sm:text-sm line-clamp-2'} text-muted-foreground job-card-description`}>
            {getLocalizedContent(position.description)}
          </p>
        )}

        {/* Salary after description */}
        {position.salaryRange && (
          <p className="text-xs sm:text-sm font-medium text-foreground flex items-center gap-1">
            <DollarSign className="h-4 w-4" /> {getLocalizedContent(position.salaryRange)}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mt-auto text-sm text-muted-foreground">
          {position.city && (
            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {position.city}{position.country ? `, ${position.country}` : ''}</span>
          )}
          {position.employmentType && (
            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {position.employmentType}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className={`flex flex-col items-center ${compactMobile ? 'gap-1 sm:gap-2 pt-1 sm:pt-2 pb-2 sm:pb-3' : 'gap-2 sm:gap-3 pt-2 sm:pt-3 pb-3 sm:pb-4'} border-t border-border px-3 sm:px-6 relative z-10 mt-auto shrink-0`}>
        {postedAgo && (
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {postedAgo}</span>
        )}

        <div className="flex items-center gap-1 w-full">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center justify-center gap-1 flex-1 h-7 sm:h-8 text-xs font-medium hover:bg-blue-50 hover:border-blue-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 min-w-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsCompanyModalOpen(true);
            }}
          >
            <Building2 className="h-3 w-3 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{t('position_card.company_info')}</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex items-center justify-center gap-1 flex-1 h-7 sm:h-8 text-xs font-medium hover:bg-blue-50 hover:border-blue-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 min-w-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsDepartmentModalOpen(true);
            }}
          >
            <Briefcase className="h-3 w-3 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{t('position_card.department_info')}</span>
          </Button>
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center justify-center gap-1 flex-1 h-7 sm:h-8 text-xs font-medium hover:bg-blue-50 hover:border-blue-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100 transition-all duration-300 min-w-0">
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                <span className="hidden sm:inline truncate">{t('position_card.view_details')}</span>
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl leading-tight">{(position.title && getLocalizedContent(position.title)) || 'Position'}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">{t('modals.position_details.title')}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-2">{t('modals.position_details.description')}</h4>
                <p className="text-sm text-muted-foreground">
                  {(position.description && getLocalizedContent(position.description)) || 
                   (departmentFromAPI?.description && getLocalizedContent(departmentFromAPI.description)) || 
                   (companyFromAPI?.description && getLocalizedContent(companyFromAPI.description)) || 
                   t('modals.position_details.no_description')}
                </p>
              </div>
              
              {position.salaryRange && (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('modals.position_details.salary_range')}</h4>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    <span>{(position.salaryRange && getLocalizedContent(position.salaryRange)) || 'Not specified'}</span>
                  </div>
                </div>
              )}
              
              {position.employmentType && (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('modals.position_details.employment_type')}</h4>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    <span>{(position.employmentType && getLocalizedContent(position.employmentType)) || 'Not specified'}</span>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-2">{t('modals.position_details.department')}</h4>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{(departmentFromAPI?.name && getLocalizedContent(departmentFromAPI.name)) || 'Department'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 ml-6">
                  <span className="text-sm text-muted-foreground">
                    {companyName}
                  </span>
                </div>
              </div>
              
              {position.applyLink && (
                <div>
                  <h4 className="text-sm font-medium mb-2">{t('modals.position_details.apply_link')}</h4>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4" />
                    <a 
                      href={(position.applyLink && getLocalizedContent(position.applyLink)) || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-[250px]"
                    >
                      {(position.applyLink && getLocalizedContent(position.applyLink)) || 'No link available'}
                    </a>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium mb-2">{t('modals.position_details.created')}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(position.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
                {t('modals.position_details.close')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>

        {position.applyLink ? (
          <button
            onClick={handleApply}
            className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-blue-100 hover:from-blue-700 hover:to-indigo-700 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 w-full justify-center h-8 sm:h-10"
          >
            <span className="hidden sm:inline">{t('position_card.apply')}</span>
            <span className="sm:hidden">{t('position_card.apply')}</span>
            <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        ) : (
          <Button
            onClick={handleApply}
            disabled={isApplying}
            className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:shadow-blue-100 hover:from-blue-600/90 hover:to-indigo-600/90 hover:-translate-y-1 transition-all duration-300 flex items-center gap-2 disabled:opacity-60 w-full justify-center h-8 sm:h-10"
          >
            {isApplying ? 'Generating…' : (
              <>
                <span className="hidden sm:inline">{t('position_card.apply')}</span>
                <span className="sm:hidden">{t('position_card.apply')}</span>
              </>
            )} <Send className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        )}
      </CardFooter>
      
      {/* Company Info Modal */}
      <CompanyInfoModal 
        company={companyFromAPI}
        isOpen={isCompanyModalOpen}
        onClose={() => {
          console.log('Closing company modal');
          setIsCompanyModalOpen(false);
        }}
      />
      
      {/* Department Info Modal */}
      <DepartmentInfoModal 
        department={departmentFromAPI}
        company={companyFromAPI}
        isOpen={isDepartmentModalOpen}
        onClose={() => {
          console.log('Closing department modal');
          setIsDepartmentModalOpen(false);
        }}
      />
    </Card>
  );
});