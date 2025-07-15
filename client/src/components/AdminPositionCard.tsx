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

export function AdminPositionCard({ position, onEdit, onDelete, showDepartment = false }: AdminPositionCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Fetch company and department data using direct API calls (same as admin pages)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesData, departmentsData] = await Promise.all([
          getCompanies(),
          getDepartments()
        ]);
        
        setCompanies(Array.isArray(companiesData) ? companiesData : []);
        setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
      } catch (error) {
        console.error('Error fetching data for AdminPositionCard:', error);
        setCompanies([]);
        setDepartments([]);
      }
    };

    fetchData();
  }, []);
  
  const departmentFromAPI = departments?.find(d => d.id === position.departmentId);
  const companyFromAPI = companies?.find(c => c.id === departmentFromAPI?.companyId);

  // Debug logging
  console.log('[AdminPositionCard] position.departmentId:', position.departmentId, typeof position.departmentId);
  console.log('[AdminPositionCard] departments:', departments);
  console.log('[AdminPositionCard] companies:', companies);
  console.log('[AdminPositionCard] departmentFromAPI:', departmentFromAPI);
  console.log('[AdminPositionCard] looking for companyId:', departmentFromAPI?.companyId, typeof departmentFromAPI?.companyId);
  console.log('[AdminPositionCard] companyFromAPI:', companyFromAPI);

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
    <Avatar className="h-10 w-10 ring-2 ring-offset-2 ring-offset-background ring-blue-500/40 group-hover:ring-blue-500/70 transition-shadow duration-300 shadow-lg group-hover:shadow-xl">
      {inheritedData.logoUrl && !logoError ? (
        <AvatarImage 
          src={inheritedData.logoUrl} 
          alt={inheritedData.companyName} 
          decoding="async" 
          loading="lazy"
          onError={handleLogoError} 
        />
      ) : (
        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold">
          {inheritedData.companyName.charAt(0)}
        </AvatarFallback>
      )}
    </Avatar>
  );

  return (
    <Card
      className="animate-fade-in group relative overflow-hidden border border-border bg-white/60 dark:bg-white/5 backdrop-blur-md hover:shadow-xl hover:-translate-y-1 hover:rotate-[0.3deg] transition-transform duration-150 h-[350px] w-full flex flex-col"
    >
      {/* glass reflection */}
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* gradient ring on hover */}
      <span className="absolute inset-0 rounded-[inherit] bg-gradient-to-br from-blue-600/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Edit / Delete buttons */}
      {(onEdit || onDelete) && (
        <div className="absolute top-2 right-2 flex gap-1 z-20">
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

      <CardHeader className="flex items-start gap-3 pb-2 relative z-10">
        <CompanyAvatar />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm leading-tight text-foreground">
              {inheritedData.companyName}
            </h3>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs hover:bg-blue-100 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCompanyModalOpen(true);
                }}
              >
                <Building2 className="h-3 w-3 mr-1" />
                Company
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs hover:bg-green-100 dark:hover:bg-green-900 border border-green-200 dark:border-green-800"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDepartmentModalOpen(true);
                }}
              >
                <Briefcase className="h-3 w-3 mr-1" />
                Dept
              </Button>
            </div>
          </div>
          {showDepartment && (
            <p className="text-xs text-muted-foreground line-clamp-1 flex items-center gap-1 mt-1">
              <Building2 className="h-3 w-3" />
              {inheritedData.departmentName}
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pb-2 relative z-10 flex-1 flex flex-col">
        <CardTitle className="text-base font-semibold tracking-tight leading-snug text-foreground group-hover:text-primary line-clamp-2">
          {position.title}
        </CardTitle>

        {inheritedData.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
            {inheritedData.description.length > 80 
              ? `${inheritedData.description.substring(0, 80)}...` 
              : inheritedData.description}
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

      <CardFooter className="flex flex-col items-center gap-2 border-t border-border pt-2 pb-3 relative z-10 mt-auto shrink-0">
        {postedAgo && (
          <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {postedAgo}</span>
        )}

        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setIsDetailsDialogOpen(true)}>View Details</Button>
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

        {/* Admin-specific footer - no Apply button */}
        <div className="text-xs text-muted-foreground">
          Admin View - Position Management
        </div>
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
}