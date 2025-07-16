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
    <Avatar className="h-20 w-20 border-2 border-white/20 shadow-lg">
      {inheritedData.logoUrl && !logoError ? (
        <AvatarImage 
          src={inheritedData.logoUrl} 
          alt={inheritedData.companyName} 
          className="object-contain object-center w-full h-full p-2"
          loading="lazy"
          decoding="async"
          onError={handleLogoError} 
        />
      ) : (
        <AvatarFallback 
          className="text-white font-semibold text-xl"
          style={{ backgroundColor: inheritedData.companyColor }}
        >
          {inheritedData.companyName.charAt(0)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <Card
      className="animate-fade-in group relative overflow-hidden border border-border bg-white dark:bg-gray-900 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ease-out h-[480px] w-full flex flex-col"
    >
      {/* glass reflection */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* gradient ring on hover */}
      <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-600/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />



      <CardHeader className="flex items-start gap-3 pb-2 relative z-10">
        <CompanyAvatar />
        <div className="flex-1">
          <h3 className="font-semibold text-sm leading-tight text-foreground">
            {inheritedData.companyName}
          </h3>
          {showDepartment && (
            <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {inheritedData.departmentName}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-2 relative z-10 flex-1 flex flex-col">
        <CardTitle className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary job-card-admin-title">
          {position.title}
        </CardTitle>

        {inheritedData.description && (
          <p className="text-xs text-muted-foreground job-card-admin-description">
            {inheritedData.description}
          </p>
        )}

        {/* Salary after description */}
        {position.salaryRange && (
          <p className="text-xs font-medium text-foreground flex items-center gap-1 mt-1">
            <DollarSign className="h-3 w-3" /> {position.salaryRange}
          </p>
        )}

        <div className="flex flex-wrap gap-3 mt-auto text-xs text-muted-foreground">
          {(inheritedData.city || inheritedData.country) && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> 
              {inheritedData.city}{inheritedData.country ? `, ${inheritedData.country}` : ''}
            </span>
          )}
          {position.employmentType && (
            <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {position.employmentType}</span>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t border-border pt-2 pb-3 relative z-10 mt-auto shrink-0">
        {postedAgo && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 justify-center"><Clock className="h-3 w-3" /> {postedAgo}</span>
        )}

        {/* Action buttons row */}
        <div className="flex justify-center gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCompanyModalOpen(true)}
            className="flex items-center gap-1 flex-1 max-w-[80px]"
          >
            <Building2 className="h-3 w-3" />
            Company
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDepartmentModalOpen(true)}
            className="flex items-center gap-1 flex-1 max-w-[80px]"
          >
            <Briefcase className="h-3 w-3" />
            Dept
          </Button>
          <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-1 flex-1 max-w-[90px]">
                <ExternalLink className="h-3 w-3" />
                Details
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
        </div>

        {/* Edit and Delete buttons for admin */}
        {(onEdit || onDelete) && (
          <div className="flex justify-center gap-2 w-full">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-1"
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
                className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </Button>
            )}
          </div>
        )}
      </CardFooter>
      
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
    </Card>
  );
});