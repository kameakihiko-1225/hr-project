import React, { useState, useEffect } from 'react';
import { Department } from '../types/department';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Pencil, Trash2, Building2, Users, BriefcaseBusiness } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Separator } from './ui/separator';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { createLogger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';
import { LocalizedContent } from '@shared/schema';
import { getCompanies } from '@/lib/api';

const logger = createLogger('departmentCard');

interface DepartmentCardProps {
  department: Department & { positionCount?: number };
  onEdit?: (department: Department) => void;
  onDelete?: (department: Department) => void;
  showCompany?: boolean;
}

export function DepartmentCard({ department, onEdit, onDelete, showCompany = false }: DepartmentCardProps) {
  const [location, navigate] = useLocation();
  const { i18n } = useTranslation();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [companyLogoError, setCompanyLogoError] = useState(false);
  const [companies, setCompanies] = useState<any[]>([]);
  
  // Fetch companies data to get company names
  useEffect(() => {
    if (showCompany && department.companyId) {
      getCompanies()
        .then(response => {
          if (response.success) {
            setCompanies(response.data);
          }
        })
        .catch(error => {
          logger.error('Failed to fetch companies:', error);
        });
    }
  }, [showCompany, department.companyId]);
  
  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(department);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(department);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleViewPositions = () => {
    navigate(`/admin/positions?departmentId=${department.id}`);
  };

  const handleLogoError = () => {
    const company = companies.find(c => c.id === department.companyId);
    logger.warn(`Failed to load logo for company: ${company?.name ? getLocalizedContent(company.name) : 'Unknown'}`);
    setCompanyLogoError(true);
  };

  // Generate initials from company name if available
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Get company information from fetched companies
  const company = companies.find(c => c.id === department.companyId);
  const companyName = company ? getLocalizedContent(company.name) : '';
  const companyInitials = company?.name ? getInitials(getLocalizedContent(company.name)) : '';

  // Use positionCount from backend if available, otherwise fallback to existing positions array
  const positionCount = department.positionCount !== undefined 
    ? department.positionCount 
    : Array.isArray(department.positions) 
      ? department.positions.map((dp: any) => dp.position).filter(Boolean).length
      : 0;
  
  // Create display name with company name if showCompany is true
  const displayName = showCompany && companyName 
    ? `${getLocalizedContent(department.name)} (${companyName})`
    : getLocalizedContent(department.name);

  // For modal details, still use the actual positions array if available
  const positions = Array.isArray(department.positions)
    ? department.positions.map((dp: any) => dp.position).filter(Boolean)
    : [];

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-bold truncate">{displayName}</CardTitle>
          <div className="flex gap-2">
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={handleEdit} className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Department</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete the department "{getLocalizedContent(department.name)}"? This action cannot be undone.
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
        </div>
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {department.description ? getLocalizedContent(department.description) : 'No description provided'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-col gap-2">
          {showCompany && company && (
            <div className="flex items-center gap-2 text-sm">
              {company.logoUrl && !companyLogoError ? (
                <Avatar className="h-6 w-6 mr-1">
                  <AvatarImage 
                    src={company.logoUrl} 
                    alt={getLocalizedContent(company.name)}
                    onError={handleLogoError}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                    {companyInitials}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-muted-foreground">Company:</span>
              <span className="font-medium">{getLocalizedContent(company.name)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Positions:</span>
            <Badge variant="secondary" className="rounded-md font-medium">
              {positionCount}
            </Badge>
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="pt-3 flex justify-between">
        <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" onClick={() => setIsDetailsDialogOpen(true)}>View Details</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{getLocalizedContent(department.name)}</DialogTitle>
              <DialogDescription>Department Details</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {department.description ? getLocalizedContent(department.description) : 'No description provided'}
                </p>
              </div>
              {showCompany && company && (
                <div key="company-info">
                  <h4 className="text-sm font-medium mb-2">Company</h4>
                  <div className="flex items-center gap-2">
                    {company.logoUrl && !companyLogoError ? (
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={company.logoUrl} 
                          alt={getLocalizedContent(company.name)}
                          onError={handleLogoError}
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-800">
                          {companyInitials}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <Building2 className="h-4 w-4" />
                    )}
                    <span>{getLocalizedContent(company.name)}</span>
                  </div>
                </div>
              )}
              <div key="positions-info">
                <h4 className="text-sm font-medium mb-2">Positions ({positions.length})</h4>
                {positions.length > 0 ? (
                  <div className="space-y-2">
                    {positions.slice(0, 3).map((position) => (
                      <div key={position.id} className="flex items-center gap-2">
                        <BriefcaseBusiness className="h-4 w-4 text-muted-foreground" />
                        <span>{typeof position.title === 'string' ? position.title : getLocalizedContent(position.title)}</span>
                      </div>
                    ))}
                    {positions.length > 3 && (
                      <div key="more-positions" className="text-sm text-muted-foreground">
                        +{positions.length - 3} more positions
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No positions in this department</p>
                )}
              </div>
              <div key="created-info">
                <h4 className="text-sm font-medium mb-2">Created</h4>
                <p className="text-sm text-muted-foreground">
                  {department.createdAt ? new Date(department.createdAt).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
              <Button onClick={handleViewPositions}>View Positions</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="outline" size="sm" onClick={handleViewPositions}>
          <BriefcaseBusiness className="h-4 w-4 mr-2" />
          Positions
        </Button>
      </CardFooter>
    </Card>
  );
} 