import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { useToast } from '../../../components/ui/use-toast';
import { AdminPositionCard } from '../../../components/AdminPositionCard';
import { createPosition, deletePosition, getPositions, getDepartments, updatePosition } from '../../../lib/api';
import { Position } from '../../../types/position';
import { Department } from '../../../types/department';
import { Loader2, Plus, Briefcase, Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { MultilingualInput } from '../../../components/ui/multilingual-input';
import { LocalizedContent } from '@shared/schema';
import { useTranslation } from 'react-i18next';

export default function PositionsPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { i18n } = useTranslation();
  
  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  };
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applicantCounts, setApplicantCounts] = useState<{ positionId: number; positionTitle: string; appliedCount: number; }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get departmentId from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>(
    urlParams.get('departmentId') || 'all'
  );

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);
  const [formData, setFormData] = useState({
    title: { en: '' } as LocalizedContent,
    description: { en: '' } as LocalizedContent,
    salaryRange: { en: '' } as LocalizedContent,
    employmentType: { en: 'Full-time' } as LocalizedContent,
    departmentId: '',
    applyLink: { en: '' } as LocalizedContent
  });

  // Employment type options
  const employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Temporary'
  ];

  // Load positions and departments with optimized parallel loading
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch departments, positions, and applicant counts in parallel for better performance
        const [departmentsData, positionsData, applicantCountsData] = await Promise.allSettled([
          getDepartments(undefined, true, undefined, true), // Use raw=true for admin interface
          fetch('/api/positions?raw=true').then(res => res.json()), // Use direct fetch for raw admin data
          fetch('/api/all-applied-positions').then(res => res.json())
        ]);
        
        console.log('[PositionsPage] departmentsData:', departmentsData);

        // Handle departments
        if (departmentsData.status === 'fulfilled' && departmentsData.value && Array.isArray(departmentsData.value)) {
          setDepartments(departmentsData.value);
        } else {
          console.error('Failed to load departments:', departmentsData.status === 'rejected' ? departmentsData.reason : 'Invalid data');
          setDepartments([]);
        }

        // Handle applicant counts
        if (applicantCountsData.status === 'fulfilled' && applicantCountsData.value?.data && Array.isArray(applicantCountsData.value.data)) {
          setApplicantCounts(applicantCountsData.value.data);
        } else {
          console.error('Failed to load applicant counts:', applicantCountsData.status === 'rejected' ? applicantCountsData.reason : 'Invalid data');
          setApplicantCounts([]);
        }

        // Handle positions
        if (positionsData.status === 'fulfilled' && positionsData.value?.success && Array.isArray(positionsData.value.data)) {
          setPositions(positionsData.value.data);
        } else {
          console.error('Failed to load positions:', positionsData.status === 'rejected' ? positionsData.reason : 'Invalid data');
          setPositions([]);
        }
        
        // Only show error toast if both requests failed
        if (departmentsData.status === 'rejected' && positionsData.status === 'rejected') {
          toast({
            title: 'Error',
            description: 'Failed to load data. Please try again.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setDepartments([]);
        setPositions([]);
        toast({
          title: 'Error',
          description: 'Failed to load data. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedDepartmentId, toast]);

  // Update URL when department filter changes (commented out - no longer needed)
  // useEffect(() => {
  //   if (selectedDepartmentId && selectedDepartmentId !== 'all') {
  //     setSearchParams({ departmentId: selectedDepartmentId });
  //   } else {
  //     setSearchParams({});
  //   }
  // }, [selectedDepartmentId, setSearchParams]);

  // Add debug logs for data flow
  console.log('[PositionsPage] positions:', positions);
  console.log('[PositionsPage] selectedDepartmentId:', selectedDepartmentId);

  // Filter positions by search term and department
  const filteredPositions = positions.filter(position => {
    console.log('[Filter] position:', position);
    const title = typeof position.title === 'string' ? position.title : position.title?.en || '';
    const description = typeof position.description === 'string' ? position.description : position.description?.en || '';
    
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (description && description.toLowerCase().includes(searchTerm.toLowerCase()));

    // If 'all', show all; otherwise, check if departmentId matches
    const matchesDepartment =
      selectedDepartmentId === 'all' ||
      position.departmentId.toString() === selectedDepartmentId.toString();

    return matchesSearch && matchesDepartment;
  });
  console.log('[Render] filteredPositions:', filteredPositions);

  // Create a map for easy lookup of applicant counts and determine top-tier badges
  const applicantCountMap = new Map<number, { count: number; topTierBadge?: 1 | 2 | 3 }>();
  
  applicantCounts.forEach((item, index) => {
    const badge = index < 3 ? (index + 1) as (1 | 2 | 3) : undefined;
    applicantCountMap.set(item.positionId, { 
      count: item.appliedCount, 
      topTierBadge: badge 
    });
  });

  // Handle form input changes for non-multilingual fields (legacy compatibility)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // For backward compatibility, handle string values by converting to LocalizedContent
    if (['title', 'description', 'salaryRange', 'employmentType', 'applyLink'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: { en: value } as LocalizedContent }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'employmentType') {
      // Convert employmentType to LocalizedContent
      setFormData(prev => ({ ...prev, [name]: { en: value } as LocalizedContent }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle create position
  const handleCreatePosition = async () => {
    try {
      if (!formData.title || (typeof formData.title === 'object' && !formData.title.en) || !formData.departmentId) {
        toast({
          title: 'Validation Error',
          description: 'Position title and department are required.',
          variant: 'destructive'
        });
        return;
      }

      // Check if apply link has any content, if not, omit it completely
      const hasApplyLinkContent = formData.applyLink && 
        (formData.applyLink.en?.trim() || formData.applyLink.ru?.trim() || formData.applyLink.uz?.trim());

      const positionData: any = {
        title: formData.title,
        description: formData.description,
        salaryRange: formData.salaryRange,
        employmentType: formData.employmentType,
        departmentId: formData.departmentId
      };

      // Only include applyLink if it has content
      if (hasApplyLinkContent) {
        positionData.applyLink = formData.applyLink;
      }

      const newPosition = await createPosition(positionData);

      setPositions(prev => [...prev, newPosition]);
      setIsCreateDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Position created successfully.'
      });
    } catch (error) {
      console.error('Error creating position:', error);
      toast({
        title: 'Error',
        description: 'Failed to create position. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle edit position
  const handleEditPosition = (position: Position) => {
    setCurrentPosition(position);
    setFormData({
      title: typeof position.title === 'string' ? { en: position.title } : position.title,
      description: typeof position.description === 'string' ? { en: position.description } : position.description || { en: '' },
      salaryRange: typeof position.salaryRange === 'string' ? { en: position.salaryRange } : position.salaryRange || { en: '' },
      employmentType: typeof position.employmentType === 'string' ? { en: position.employmentType } : position.employmentType || { en: 'Full-time' },
      departmentId: position.departmentId || '',
      applyLink: typeof position.applyLink === 'string' ? { en: position.applyLink } : position.applyLink || { en: '' }
    });
    setIsEditDialogOpen(true);
  };

  // Handle update position
  const handleUpdatePosition = async () => {
    if (!currentPosition) return;

    try {
      if (!formData.title || (typeof formData.title === 'object' && !formData.title.en)) {
        toast({
          title: 'Validation Error',
          description: 'Position title is required.',
          variant: 'destructive'
        });
        return;
      }

      // Check if apply link has any content, if not, omit it completely
      const hasApplyLinkContent = formData.applyLink && 
        (formData.applyLink.en?.trim() || formData.applyLink.ru?.trim() || formData.applyLink.uz?.trim());

      const positionData: any = {
        title: formData.title,
        description: formData.description,
        salaryRange: formData.salaryRange,
        employmentType: formData.employmentType
      };

      // Only include applyLink if it has content
      if (hasApplyLinkContent) {
        positionData.applyLink = formData.applyLink;
      }

      const updatedPosition = await updatePosition(currentPosition.id, positionData);

      setPositions(prev => 
        prev.map(pos => pos.id === currentPosition.id ? updatedPosition : pos)
      );
      
      // Invalidate React Query cache for positions to refresh data on all pages
      queryClient.invalidateQueries({ queryKey: ['/api/positions'] });
      
      setIsEditDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Position updated successfully.'
      });
    } catch (error) {
      console.error('Error updating position:', error);
      toast({
        title: 'Error',
        description: 'Failed to update position. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle delete position
  const handleDeletePosition = async (position: Position) => {
    try {
      await deletePosition(position.id);
      setPositions(prev => prev.filter(pos => pos.id !== position.id));
      
      toast({
        title: 'Success',
        description: 'Position deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting position:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete position. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: { en: '' } as LocalizedContent,
      description: { en: '' } as LocalizedContent,
      salaryRange: { en: '' } as LocalizedContent,
      employmentType: { en: 'Full-time' } as LocalizedContent,
      departmentId: '',
      applyLink: { en: '' } as LocalizedContent
    });
    setCurrentPosition(null);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Positions</h1>
            <p className="text-muted-foreground mt-1">
              Manage job positions in your organization
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4 sm:mt-0">
            <Plus className="mr-2 h-4 w-4" /> Add Position
          </Button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search positions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={selectedDepartmentId}
            onValueChange={setSelectedDepartmentId}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {Array.isArray(departments) && departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {getLocalizedContent(department.name)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPositions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {filteredPositions.map((position) => {
              const applicantData = applicantCountMap.get(position.id);
              return (
                <div key={position.id} className="h-full">
                  <AdminPositionCard
                    position={position}
                    onEdit={handleEditPosition}
                    onDelete={handleDeletePosition}
                    showDepartment={!selectedDepartmentId}
                    applicantCount={applicantData?.count}
                    topTierBadge={applicantData?.topTierBadge}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No positions found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm || selectedDepartmentId
                ? "Try adjusting your filters"
                : "Get started by adding your first position"}
            </p>
            {!searchTerm && !selectedDepartmentId && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Position
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Position Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create Position</DialogTitle>
            <DialogDescription>
              Add a new job position to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="department" className="text-sm font-medium">
                Department
              </label>
              <Select
                value={formData.departmentId}
                onValueChange={(value) => handleSelectChange('departmentId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(departments) && departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {getLocalizedContent(department.name)} {department.company ? `(${getLocalizedContent(department.company.name)})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <MultilingualInput
              label="Position Title"
              value={formData.title as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
              placeholder="e.g., Software Engineer"
              required
            />
            
            <MultilingualInput
              label="Description"
              value={formData.description as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Position description"
              type="textarea"
            />
            
            <MultilingualInput
              label="Salary Range"
              value={formData.salaryRange as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, salaryRange: value }))}
              placeholder="e.g., $80,000 - $120,000"
            />
            
            <div className="grid gap-2">
              <label htmlFor="employmentType" className="text-sm font-medium">
                Employment Type
              </label>
              <Select
                value={getLocalizedContent(formData.employmentType)}
                onValueChange={(value) => handleSelectChange('employmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <MultilingualInput
              label="Apply Link (Optional)"
              value={formData.applyLink as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, applyLink: value }))}
              placeholder="e.g., https://forms.google.com/apply or mailto:careers@company.com"
            />
            <p className="text-xs text-muted-foreground">
              If provided, the Apply Now button will redirect to this link. Leave empty to use default application flow.
            </p>

            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreatePosition}>Create Position</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Position Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update position information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-4 py-4">
            <MultilingualInput
              label="Position Title"
              value={formData.title as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
              placeholder="e.g., Software Engineer"
              required
            />
            
            <MultilingualInput
              label="Description"
              value={formData.description as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Position description"
              type="textarea"
            />
            
            <MultilingualInput
              label="Salary Range"
              value={formData.salaryRange as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, salaryRange: value }))}
              placeholder="e.g., $80,000 - $120,000"
            />
            
            <div className="grid gap-2">
              <label htmlFor="employmentType" className="text-sm font-medium">
                Employment Type
              </label>
              <Select
                value={getLocalizedContent(formData.employmentType)}
                onValueChange={(value) => handleSelectChange('employmentType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>
                <SelectContent>
                  {employmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <MultilingualInput
              label="Apply Link (Optional)"
              value={formData.applyLink as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, applyLink: value }))}
              placeholder="e.g., https://forms.google.com/apply or mailto:careers@company.com"
            />
            <p className="text-xs text-muted-foreground">
              If provided, the Apply Now button will redirect to this link. Leave empty to use default application flow.
            </p>
            {currentPosition?.department && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Department
                </label>
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {getLocalizedContent(currentPosition.department.name)}
                    {currentPosition.department.company && (
                      <span className="text-muted-foreground ml-1">
                        ({getLocalizedContent(currentPosition.department.company.name)})
                      </span>
                    )}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Department cannot be changed. Create a new position if needed.
                </p>
              </div>
            )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePosition}>Update Position</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 