import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { useToast } from '../../../components/ui/use-toast';
import { PositionCard } from '../../../components/PositionCard';
import { createPosition, deletePosition, getPositions, getDepartments, updatePosition } from '../../../lib/api';
import { Position } from '../../../types/position';
import { Department } from '../../../types/department';
import { Loader2, Plus, Briefcase, Search } from 'lucide-react';

export default function PositionsPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
    title: '',
    description: '',
    salaryRange: '',
    employmentType: '',
    departmentId: ''
  });

  // Employment type options
  const employmentTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Internship',
    'Temporary'
  ];

  // Load positions and departments
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch departments first
        try {
          const departmentsData = await getDepartments();
          // Ensure departments is an array
          if (departmentsData && Array.isArray(departmentsData)) {
            setDepartments(departmentsData);
          } else {
            console.error('Departments data is not an array:', departmentsData);
            setDepartments([]); // Set empty array as fallback
            toast({
              title: 'Warning',
              description: 'Failed to load departments. Some features may be limited.',
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error fetching departments:', error);
          setDepartments([]); // Set empty array as fallback
          toast({
            title: 'Warning',
            description: 'Failed to load departments. Some features may be limited.',
            variant: 'destructive'
          });
        }

        // Then fetch positions, filtered by department if selected
        try {
          const positionsData = await getPositions(selectedDepartmentId !== 'all' ? selectedDepartmentId : undefined);
          setPositions(Array.isArray(positionsData) ? positionsData : []);
        } catch (error) {
          console.error('Error fetching positions:', error);
          setPositions([]);
          toast({
            title: 'Error',
            description: 'Failed to load positions. Please try again.',
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
    const matchesSearch = position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.description && position.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // If 'all', show all; otherwise, check if any related department matches
    const matchesDepartment =
      selectedDepartmentId === 'all' ||
      (Array.isArray(position.departments) &&
        position.departments.some(dp => dp.department.id === selectedDepartmentId));

    return matchesSearch && matchesDepartment;
  });
  console.log('[Render] filteredPositions:', filteredPositions);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle create position
  const handleCreatePosition = async () => {
    try {
      if (!formData.title || !formData.departmentId) {
        toast({
          title: 'Validation Error',
          description: 'Position title and department are required.',
          variant: 'destructive'
        });
        return;
      }

      const newPosition = await createPosition({
        title: formData.title,
        description: formData.description,
        salaryRange: formData.salaryRange,
        employmentType: formData.employmentType,
        departmentId: formData.departmentId
      });

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
      title: position.title,
      description: position.description || '',
      salaryRange: position.salaryRange || '',
      employmentType: position.employmentType || '',
      departmentId: position.departmentId || ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle update position
  const handleUpdatePosition = async () => {
    if (!currentPosition) return;

    try {
      if (!formData.title) {
        toast({
          title: 'Validation Error',
          description: 'Position title is required.',
          variant: 'destructive'
        });
        return;
      }

      const updatedPosition = await updatePosition(currentPosition.id, {
        title: formData.title,
        description: formData.description,
        salaryRange: formData.salaryRange,
        employmentType: formData.employmentType
      });

      setPositions(prev => 
        prev.map(pos => pos.id === currentPosition.id ? updatedPosition : pos)
      );
      
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
      title: '',
      description: '',
      salaryRange: '',
      employmentType: '',
      departmentId: ''
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
                  {department.name}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPositions.map((position) => (
              <PositionCard
                key={position.id}
                position={position}
                onEdit={handleEditPosition}
                onDelete={handleDeletePosition}
                showDepartment={!selectedDepartmentId}
              />
            ))}
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Position</DialogTitle>
            <DialogDescription>
              Add a new job position to your organization.
            </DialogDescription>
          </DialogHeader>
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
                      {department.name} {department.company ? `(${department.company.name})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Position Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Software Engineer"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Position description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="salaryRange" className="text-sm font-medium">
                Salary Range
              </label>
              <Input
                id="salaryRange"
                name="salaryRange"
                placeholder="e.g., $80,000 - $120,000"
                value={formData.salaryRange}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="employmentType" className="text-sm font-medium">
                Employment Type
              </label>
              <Select
                value={formData.employmentType}
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
          </div>
          <DialogFooter>
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Position</DialogTitle>
            <DialogDescription>
              Update position information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="title" className="text-sm font-medium">
                Position Title
              </label>
              <Input
                id="title"
                name="title"
                placeholder="e.g., Software Engineer"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Position description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="salaryRange" className="text-sm font-medium">
                Salary Range
              </label>
              <Input
                id="salaryRange"
                name="salaryRange"
                placeholder="e.g., $80,000 - $120,000"
                value={formData.salaryRange}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="employmentType" className="text-sm font-medium">
                Employment Type
              </label>
              <Select
                value={formData.employmentType}
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
            {currentPosition?.department && (
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Department
                </label>
                <div className="flex items-center gap-2 p-2 rounded-md bg-muted">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {currentPosition.department.name}
                    {currentPosition.department.company && (
                      <span className="text-muted-foreground ml-1">
                        ({currentPosition.department.company.name})
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
          <DialogFooter>
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