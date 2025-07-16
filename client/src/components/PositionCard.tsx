import React, { useState, useEffect } from 'react';
import { Position } from '../types/position';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Pencil, Trash2, Building2, Briefcase, DollarSign, Clock, MapPin, Send, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/lib/authContext';
import { getBotByAdminId, createCandidateDeepLink, createPositionDeepLink } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { createLogger } from '@/lib/logger';
import { useClickCounter } from '@/contexts/ClickCounterContext';
import { CompanyInfoModal } from './CompanyInfoModal';
import { DepartmentInfoModal } from './DepartmentInfoModal';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

const logger = createLogger('positionCard');

interface PositionCardProps {
  position: Position;
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  showDepartment?: boolean;
}

export const PositionCard = React.memo(function PositionCard({ position, onEdit, onDelete, showDepartment = false }: PositionCardProps) {
  const { t } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { admin } = useAuth();
  const [isApplying, setIsApplying] = useState(false);
  const { incrementJobSeekers, incrementApplicants } = useClickCounter();
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);

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

  // Fetch company and department data with optimized caching
  const { data: companiesResponse, isLoading: companiesLoading } = useQuery({
    queryKey: ['/api/companies'],
    staleTime: 30 * 60 * 1000, // 30 minutes - companies don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache retention
  });
  
  const { data: departmentsResponse, isLoading: departmentsLoading } = useQuery({
    queryKey: ['/api/departments'],
    staleTime: 30 * 60 * 1000, // 30 minutes - departments don't change often
    gcTime: 60 * 60 * 1000, // 1 hour cache retention
  });
  
  // Extract data properly - both companies and departments return API wrapper format
  const companies = companiesResponse?.data || [];
  const departments = departmentsResponse?.data || [];
  
  const departmentFromAPI = departments?.find(d => d.id === position.departmentId);
  const companyFromAPI = companies?.find(c => c.id === departmentFromAPI?.companyId);
  
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
      console.log('Redirecting to custom apply link:', position.applyLink);
      window.open(position.applyLink, '_blank', 'noopener,noreferrer');
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
        description: `Thank you for your interest in the ${position.title} position! You will be contacted soon.` 
      });
      
      // In a real implementation, this would integrate with Telegram bot or other application system
      console.log(`Application submitted for position: ${position.title} (ID: ${position.id})`);
    } catch (error: any) {
      console.error('Apply via AI error:', error);
      toast({ title: 'Error', description: error?.message || 'Something went wrong' });
    } finally {
      setIsApplying(false);
    }
  };

  // Data inheritance logic: position -> department -> company (same as AdminPositionCard)
  const getInheritedData = () => {
    const basePosition = position;
    const department = departmentFromAPI;
    const company = companyFromAPI;

    return {
      // Logo: use position logo -> company logo -> fallback
      logoUrl: basePosition.logoUrl || company?.logoUrl || null,
      
      // Location: use position location -> department location -> company location
      city: basePosition.city || department?.city || company?.city || null,
      country: basePosition.country || department?.country || company?.country || null,
      
      // Company info
      companyName: company?.name || 'Company',
      companyColor: company?.color || '#b69b83',
      
      // Department info
      departmentName: department?.name || 'Department',
      
      // Description inheritance
      description: basePosition.description || department?.description || company?.description || null,
    };
  };

  const inheritedData = getInheritedData();
  const companyName = inheritedData.companyName;
  const companyLogoUrl = inheritedData.logoUrl;
  const postedAgo = position.createdAt ? formatDistanceToNow(new Date(position.createdAt), { addSuffix: true }) : '';

  const CompanyAvatar = () => (
    <Avatar className="h-12 w-12 border border-gray-200 dark:border-gray-600 shadow-sm">
      {companyLogoUrl && !logoError ? (
        <AvatarImage 
          src={companyLogoUrl} 
          alt={companyName} 
          className="object-contain object-center w-full h-full p-1"
          loading="lazy"
          decoding="async"
          onError={handleLogoError} 
        />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-medium text-sm">
          {companyName.charAt(0)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <Card
      className="animate-fade-in group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1 transition-all duration-300 h-[420px] w-full max-w-[480px] flex flex-col p-4"
    >
      {/* Posted time badge - top right */}
      {postedAgo && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-1">
            {postedAgo}
          </span>
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
                    Are you sure you want to delete the position "{position.title}"? This action cannot be undone.
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

      {/* Header with company info */}
      <div className="flex items-start gap-3 mb-3">
        <CompanyAvatar />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-tight">
            {companyName}
          </h3>
          {showDepartment && Array.isArray(position.departments) && position.departments.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {position.departments.map((dp, idx) => (
                <span key={dp.department.id} className="flex items-center">
                  {dp.department.name}
                  {idx < position.departments.length - 1 && <span className="mx-1">|</span>}
                </span>
              ))}
            </p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Job title */}
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 min-h-[3.5rem]">
            {position.title}
          </h2>
        </div>

        {/* Description */}
        {position.description && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {position.description}
            </p>
          </div>
        )}

        {/* Tags and meta info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {position.city && (
            <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <MapPin className="h-3 w-3" /> 
              {position.city}{position.country ? `, ${position.country}` : ''}
            </span>
          )}
          {position.employmentType && (
            <span className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full px-2 py-1">
              <Briefcase className="h-3 w-3" /> 
              {position.employmentType}
            </span>
          )}
          {position.salaryRange && (
            <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full px-2 py-1 font-medium">
              <DollarSign className="h-3 w-3" /> 
              {position.salaryRange}
            </span>
          )}
        </div>

        {/* Action buttons - inside card at bottom */}
        <div className="grid grid-cols-2 gap-2 mt-auto">
          {/* Apply Now button - full width on top */}
          <div className="col-span-2">
            <Button 
              onClick={handleApply}
              className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-all duration-200 hover:shadow-md"
            >
              {t('position_card.apply_now')}
            </Button>
          </div>
          
          {/* Info buttons - side by side */}
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsCompanyModalOpen(true);
            }}
          >
            <Building2 className="h-3 w-3 mr-1" />
            {t('position_card.company_info')}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setIsDepartmentModalOpen(true);
            }}
          >
            <Briefcase className="h-3 w-3 mr-1" />
            {t('position_card.department_info')}
          </Button>
        </div>
      </div>

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

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute bottom-2 right-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{position.title}</DialogTitle>
            <DialogDescription>Position Details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">
                {inheritedData.description || 'No description provided'}
              </p>
            </div>
            
            {position.salaryRange && (
              <div>
                <h4 className="text-sm font-medium mb-2">Salary Range</h4>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  <span>{position.salaryRange}</span>
                </div>
              </div>
            )}
            
            {position.employmentType && (
              <div>
                <h4 className="text-sm font-medium mb-2">Employment Type</h4>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>{position.employmentType}</span>
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2">Department</h4>
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                <span>{inheritedData.departmentName}</span>
              </div>
              <div className="flex items-center gap-2 mt-1 ml-6">
                <span className="text-sm text-muted-foreground">
                  {inheritedData.companyName}
                </span>
              </div>
            </div>
            
            {position.applyLink && (
              <div>
                <h4 className="text-sm font-medium mb-2">Apply Link</h4>
                <div className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  <a 
                    href={position.applyLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate max-w-[250px]"
                  >
                    {position.applyLink}
                  </a>
                </div>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2">Created</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(position.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
});