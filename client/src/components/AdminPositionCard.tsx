import React, { useState, useEffect } from 'react';
import { Position } from '../types/position';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Pencil, Trash2, Building2, Briefcase, DollarSign, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { createLogger } from '@/lib/logger';
import { CompanyInfoModal } from './CompanyInfoModal';
import { DepartmentInfoModal } from './DepartmentInfoModal';
import { getDepartments, getCompanies } from '@/lib/api';
import { Department } from '../types/department';
import { Company } from '../types/company';

const logger = createLogger('adminPositionCard');

interface AdminPositionCardProps {
  position: Position;
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  showDepartment?: boolean;
}

export const AdminPositionCard = React.memo(function AdminPositionCard({ position, onEdit, onDelete, showDepartment = false }: AdminPositionCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch company and department data using direct API calls with caching
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const [companiesData, departmentsData] = await Promise.all([
          getCompanies(),
          getDepartments()
        ]);
        
        if (!isMounted) return;
        
        // Extract data properly - companies returns API wrapper, departments returns direct array
        const companiesArray = companiesData?.data || companiesData || [];
        const departmentsArray = Array.isArray(departmentsData) ? departmentsData : [];
        
        setCompanies(companiesArray);
        setDepartments(departmentsArray);
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching data for AdminPositionCard:', error);
        setCompanies([]);
        setDepartments([]);
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  const departmentFromAPI = departments?.find(d => d.id === position.departmentId);
  const companyFromAPI = companies?.find(c => c.id === departmentFromAPI?.companyId);



  // Data inheritance logic: position -> department -> company
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
      
      // Other inherited fields
      description: basePosition.description || department?.description || company?.description || null,
    };
  };

  const inheritedData = getInheritedData();

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
    logger.warn(`Failed to load logo for company: ${inheritedData.companyName}`);
    setLogoError(true);
  };

  const postedAgo = position.createdAt ? formatDistanceToNow(new Date(position.createdAt), { addSuffix: true }) : '';

  const CompanyAvatar = () => (
    <Avatar className="h-12 w-12 border border-gray-200 dark:border-gray-600 shadow-sm">
      {inheritedData.logoUrl && !logoError ? (
        <AvatarImage 
          src={inheritedData.logoUrl} 
          alt={inheritedData.companyName} 
          className="object-contain object-center w-full h-full p-1"
          loading="lazy"
          decoding="async"
          onError={handleLogoError} 
        />
      ) : (
        <AvatarFallback 
          className="text-white font-medium text-sm"
          style={{ backgroundColor: inheritedData.companyColor }}
        >
          {inheritedData.companyName.charAt(0)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <Card
      className="animate-fade-in group relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1 transition-all duration-300 h-[400px] w-full flex flex-col p-4"
    >
      {/* Posted time badge - top right */}
      {postedAgo && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-1">
            {postedAgo}
          </span>
        </div>
      )}

      {/* Header with company info */}
      <div className="flex items-start gap-3 mb-3">
        <CompanyAvatar />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-tight">
            {inheritedData.companyName}
          </h3>
          {showDepartment && (
            <p className="text-xs text-gray-500 dark:text-gray-500 truncate flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {inheritedData.departmentName}
            </p>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col justify-between">
        {/* Job title */}
        <div className="mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2 min-h-[3rem]">
            {position.title}
          </h2>
        </div>

        {/* Description */}
        {inheritedData.description && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {inheritedData.description}
            </p>
          </div>
        )}

        {/* Tags and meta info */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(inheritedData.city || inheritedData.country) && (
            <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full px-2 py-1">
              <MapPin className="h-3 w-3" /> 
              {inheritedData.city}{inheritedData.country ? `, ${inheritedData.country}` : ''}
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
        <div className="grid grid-cols-3 gap-2 mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCompanyModalOpen(true)}
            className="text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Building2 className="h-3 w-3 mr-1" />
            Company
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDepartmentModalOpen(true)}
            className="text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Briefcase className="h-3 w-3 mr-1" />
            Dept
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDetailsDialogOpen(true)}
            className="text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Details
          </Button>
        </div>

        {/* Edit and Delete buttons for admin */}
        {(onEdit || onDelete) && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="text-xs font-medium flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" />
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-xs font-medium text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
      
      {/* Company Info Modal */}
      <CompanyInfoModal 
        company={companyFromAPI}
        isOpen={isCompanyModalOpen}
        onClose={() => setIsCompanyModalOpen(false)}
      />
      
      {/* Department Info Modal */}
      <DepartmentInfoModal 
        department={departmentFromAPI}
        company={companyFromAPI}
        isOpen={isDepartmentModalOpen}
        onClose={() => setIsDepartmentModalOpen(false)}
      />

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
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