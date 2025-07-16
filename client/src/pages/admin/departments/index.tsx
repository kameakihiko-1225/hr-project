import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { useToast } from '../../../components/ui/use-toast';
import { DepartmentCard } from '../../../components/DepartmentCard';
import { createDepartment, deleteDepartment, getDepartments, getCompanies, updateDepartment } from '../../../lib/api';
import { Department } from '../../../types/department';
import { Company } from '../../../types/company';
import { Loader2, Plus, Building2, Search } from 'lucide-react';
import { MultilingualInput } from '../../../components/ui/multilingual-input';
import { LocalizedContent } from '@shared/schema';

export default function DepartmentsPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  
  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  };
  
  const [departments, setDepartments] = useState<Department[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: { en: '' } as LocalizedContent,
    description: { en: '' } as LocalizedContent,
    companyId: ''
  });

  // Load departments and companies
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch companies first
        try {
          const companiesResponse = await getCompanies();
          // Ensure companies is an array
          if (companiesResponse && companiesResponse.data && Array.isArray(companiesResponse.data)) {
            setCompanies(companiesResponse.data);
          } else {
            console.error('Companies data is not an array:', companiesResponse);
            setCompanies([]); // Set empty array as fallback
            toast({
              title: 'Warning',
              description: 'Failed to load companies. Some features may be limited.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error fetching companies:', error);
          setCompanies([]); // Set empty array as fallback
          toast({
            title: 'Warning',
            description: 'Failed to load companies. Some features may be limited.',
            variant: 'destructive'
          });
        }

        // Then fetch departments, filtered by company if selected
        try {
          // Always request position counts for admin/department page
          const departmentsData = await getDepartments(selectedCompanyId !== 'all' ? selectedCompanyId : undefined, true);
          console.log('[DepartmentsPage] departmentsData with position counts:', departmentsData);
          setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
        } catch (error) {
          console.error('Error fetching departments:', error);
          setDepartments([]);
          toast({
            title: 'Error',
            description: 'Failed to load departments. Please try again.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        console.error('Error fetching data:', error);
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
  }, [selectedCompanyId, toast]);

  // Note: URL parameter updates removed to fix ReferenceError
  // Company filter state is managed locally

  // Filter departments by search term and company
  const filteredDepartments = departments.filter(department => {
    const name = typeof department.name === 'string' ? department.name : department.name?.en || '';
    const description = typeof department.description === 'string' ? department.description : department.description?.en || '';
    
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (description && description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // If selectedCompanyId is 'all', show all departments
    const matchesCompany = selectedCompanyId === 'all' || department.companyId === selectedCompanyId;
    
    return matchesSearch && matchesCompany;
  });

  // Handle form input changes for non-multilingual fields (legacy compatibility)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // For backward compatibility, handle string values by converting to LocalizedContent
    if (['name', 'description'].includes(name)) {
      setFormData(prev => ({ ...prev, [name]: { en: value } as LocalizedContent }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle company selection
  const handleCompanyChange = (value: string) => {
    setFormData(prev => ({ ...prev, companyId: value }));
  };

  // Handle create department
  const handleCreateDepartment = async () => {
    try {
      if (!formData.name || (typeof formData.name === 'object' && !formData.name.en) || !formData.companyId) {
        toast({
          title: 'Validation Error',
          description: 'Department name and company are required.',
          variant: 'destructive'
        });
        return;
      }

      const newDepartment = await createDepartment({
        name: formData.name,
        description: formData.description,
        companyId: formData.companyId
      });

      setDepartments(prev => [...prev, newDepartment]);
      setIsCreateDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Department created successfully.'
      });
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: 'Failed to create department. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle edit department
  const handleEditDepartment = (department: Department) => {
    setCurrentDepartment(department);
    setFormData({
      name: typeof department.name === 'string' ? { en: department.name } : department.name,
      description: typeof department.description === 'string' ? { en: department.description } : department.description || { en: '' },
      companyId: department.company?.id || ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle update department
  const handleUpdateDepartment = async () => {
    if (!currentDepartment) return;

    try {
      if (!formData.name || (typeof formData.name === 'object' && !formData.name.en)) {
        toast({
          title: 'Validation Error',
          description: 'Department name is required.',
          variant: 'destructive'
        });
        return;
      }

      const updatedDepartment = await updateDepartment(currentDepartment.id, {
        name: formData.name,
        description: formData.description
      });

      setDepartments(prev => 
        prev.map(dept => dept.id === currentDepartment.id ? updatedDepartment : dept)
      );
      
      setIsEditDialogOpen(false);
      resetForm();

      toast({
        title: 'Success',
        description: 'Department updated successfully.'
      });
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: 'Error',
        description: 'Failed to update department. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle delete department
  const handleDeleteDepartment = async (department: Department) => {
    try {
      await deleteDepartment(department.id);
      setDepartments(prev => prev.filter(dept => dept.id !== department.id));
      
      toast({
        title: 'Success',
        description: 'Department deleted successfully.'
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete department. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: { en: '' } as LocalizedContent,
      description: { en: '' } as LocalizedContent,
      companyId: ''
    });
    setCurrentDepartment(null);
  };

  // Add log before rendering DepartmentCard list
  console.log('[DepartmentsPage] departments:', departments);
  return (
    <AdminLayout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground mt-1">
              Manage your organization's departments
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4 sm:mt-0">
            <Plus className="mr-2 h-4 w-4" /> Add Department
          </Button>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search departments..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select
            value={selectedCompanyId}
            onValueChange={setSelectedCompanyId}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {Array.isArray(companies) && companies.map((company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredDepartments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((department) => (
              <DepartmentCard
                key={department.id}
                department={department}
                onEdit={() => handleEditDepartment(department)}
                onDelete={() => handleDeleteDepartment(department)}
                showCompany={selectedCompanyId === 'all'}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No departments found</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm || selectedCompanyId
                ? "Try adjusting your filters"
                : "Get started by adding your first department"}
            </p>
            {!searchTerm && !selectedCompanyId && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" /> Add Department
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Department Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create Department</DialogTitle>
            <DialogDescription>
              Add a new department to your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="company" className="text-sm font-medium">
                Company
              </label>
              <Select
                value={formData.companyId}
                onValueChange={handleCompanyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(companies) && companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {typeof company.name === 'string' ? company.name : company.name.en || company.name.ru || company.name.uz || 'Unknown Company'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <MultilingualInput
              label="Department Name"
              value={formData.name as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="e.g., Engineering"
              required
            />
            
            <MultilingualInput
              label="Description"
              value={formData.description as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Department description"
              type="textarea"
            />
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => {
              setIsCreateDialogOpen(false);
              resetForm();
            }}>
              Cancel
            </Button>
            <Button onClick={handleCreateDepartment}>Create Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department information.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <div className="grid gap-4 py-4">
            <MultilingualInput
              label="Department Name"
              value={formData.name as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
              placeholder="e.g., Engineering"
              required
            />
            
            <MultilingualInput
              label="Description"
              value={formData.description as LocalizedContent}
              onChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
              placeholder="Department description"
              type="textarea"
            />
            {currentDepartment?.company && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Company
                </label>
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{getLocalizedContent(currentDepartment.company.name)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Company cannot be changed. Create a new department if needed.
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
            <Button onClick={handleUpdateDepartment}>Update Department</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 