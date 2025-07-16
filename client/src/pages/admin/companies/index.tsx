import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search, Building, LayoutGrid, LayoutList, AlertTriangle } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createLogger } from "@/lib/logger";
import { CompanyLogoUpload } from "@/components/CompanyLogoUpload";
import { CompanyCard } from "@/components/CompanyCard";
import { toast } from "@/components/ui/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { generateRandomColor } from "@/lib/utils";
import api from "@/lib/api";
import { Company, IndustryTag } from "@/types/company";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { IndustryTagSelect } from "@/components/IndustryTagSelect";
import { MultilingualInput } from "@/components/ui/multilingual-input";
import { LocalizedContent } from "@shared/schema";

// Create a logger for the companies page
const logger = createLogger('companiesPage');

// Use local placeholder image
const PLACEHOLDER_IMAGE = '/placeholder.svg';

interface ViewMode {
  value: "list" | "grid";
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode["value"]>("grid");
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    id: "",
    name: { en: "" } as LocalizedContent,
    email: "",
    phone: "",
    city: { en: "" } as LocalizedContent,
    country: { en: "" } as LocalizedContent,
    description: { en: "" } as LocalizedContent,
    address: { en: "" } as LocalizedContent,
    logoUrl: "",
    color: "#b69b83",
    industries: []
  });
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const fetchCompanies = async () => {
    try {
      setIsLoading(true);
      logger.debug('Fetching companies from API');
      
      const response = await api.get('/companies');
      
      if (response.success) {
        // The actual API returns data directly, not nested under companies
        const companiesData = response.data || [];
        logger.info(`Fetched ${companiesData.length} companies`);
        const cleanedData = companiesData.map((company: Company) => {
          if (company.logoUrl && company.logoUrl.startsWith('blob:')) {
            logger.warn(`Found stale blob URL for company ${company.name}, replacing with placeholder`);
            return { ...company, logoUrl: PLACEHOLDER_IMAGE };
          }
          return company;
        });
        setCompanies(cleanedData);
        setFilteredCompanies(cleanedData);
      } else {
        logger.error('Failed to fetch companies', response.error);
        toast({
          title: "Error",
          description: "Failed to load companies. Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('Error fetching companies', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading companies.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = companies.filter(company => 
        company.name.toLowerCase().includes(query) || 
        company.industry?.toLowerCase().includes(query) ||
        company.location?.toLowerCase().includes(query)
      );
      setFilteredCompanies(filtered);
    }
  }, [searchQuery, companies]);

  const resetForm = () => {
    setNewCompany({
      id: "",
      name: { en: "" } as LocalizedContent,
      email: "",
      phone: "",
      city: { en: "" } as LocalizedContent,
      country: { en: "" } as LocalizedContent,
      description: { en: "" } as LocalizedContent,
      address: { en: "" } as LocalizedContent,
      logoUrl: "",
      color: "#b69b83",
      industries: []
    });
    setIsEditMode(false);
  };

  const handleAddCompany = async () => {
    try {
      logger.info(`${isEditMode ? 'Updating' : 'Adding'} company: ${newCompany.name}`);
      
      if (!newCompany.name || (typeof newCompany.name === 'object' && !newCompany.name.en)) {
        toast({
          title: "Company name required",
          description: "Please enter a name for the company in English",
          variant: "destructive",
        });
        return;
      }
      
      if (isEditMode) {
        // Update existing company
        logger.debug(`Updating company with ID: ${newCompany.id}`);
        
        const response = await api.put(`/companies/${newCompany.id}`, {
          name: newCompany.name,
          description: newCompany.description,
          address: newCompany.address,
          email: newCompany.email,
          phone: newCompany.phone,
          city: newCompany.city,
          country: newCompany.country,
          logoUrl: newCompany.logoUrl,
          color: newCompany.color,
          industries: newCompany.industries
        });
        
        if (response.success) {
          
          // Update the company in the local state
          setCompanies(
            companies.map((company) =>
              company.id === newCompany.id ? { ...company, ...newCompany } : company
            )
          );
          
          toast({
            title: "Company updated",
            description: `${newCompany.name} has been updated successfully`,
          });
        } else {
          logger.error('Failed to update company', response.error);
          
          // In development mode, update the company in local state anyway
          if (import.meta.env.DEV) {
            setCompanies(
              companies.map((company) =>
                company.id === newCompany.id ? { ...company, ...newCompany } : company
              )
            );
            
            toast({
              title: "Company updated (mock)",
              description: `${newCompany.name} has been updated in local state`,
            });
          } else {
            toast({
              title: "Update failed",
              description: response.error || "Failed to update company",
              variant: "destructive",
            });
            return;
          }
        }
      } else {
        // Add new company
        const companyData = {
          ...newCompany,
          color: newCompany.color || generateRandomColor(),
          logoUrl: newCompany.logoUrl || PLACEHOLDER_IMAGE,
        };
        
        const response = await api.post('/companies', companyData);
        
        if (response.success && response.data) {
          // Add the new company to the list
          const newCompanyWithId = response.data;
          
          // Logo is already handled by the upload process
          
          setCompanies([...companies, newCompanyWithId]);
          
          toast({
            title: "Company added",
            description: `${newCompany.name} has been added successfully`,
          });
        } else {
          logger.error('Failed to add company', response.error);
          
          // If we're in development mode, add a mock company anyway
          if (import.meta.env.DEV) {
            const mockCompany = {
              ...companyData,
              id: `mock-${Date.now()}`,
              createdAt: new Date().toISOString(),
              adminId: 'mock-admin-id',
              jobs: []
            };
            setCompanies([...companies, mockCompany as any]);
            
            toast({
              title: "Company added (mock)",
              description: `${newCompany.name} has been added as a mock company`,
            });
          } else {
            toast({
              title: "Add failed",
              description: response.error || "Failed to add company",
              variant: "destructive",
            });
            return;
          }
        }
      }
      
      // Reset form and close dialog
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      logger.error(`Error ${isEditMode ? 'updating' : 'adding'} company`, error);
      toast({
        title: `${isEditMode ? 'Update' : 'Add'} failed`,
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async () => {
    if (!companyToDelete) return;
    
    try {
      logger.info(`Deleting company with ID: ${companyToDelete.id}`);
      
      const response = await api.delete(`/companies/${companyToDelete.id}`);
      
      if (response.success) {
        setCompanies(companies.filter((company) => company.id !== companyToDelete.id));
        
        toast({
          title: "Company deleted",
          description: `${companyToDelete.name} has been deleted successfully`,
        });
      } else {
        logger.error('Failed to delete company', response.error);
        toast({
          title: "Delete failed",
          description: response.error || "Failed to delete company",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('Error deleting company', error);
      toast({
        title: "Delete failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      // Reset the company to delete
      setCompanyToDelete(null);
    }
  };

  const handleEditCompany = (id: string) => {
    logger.info(`Editing company with ID: ${id}`);
    
    // Debug the companies array and the ID we're looking for
    logger.debug(`Available companies: ${companies.length}`);
    logger.debug(`Companies IDs: ${companies.map(c => c.id).join(', ')}`);
    
    const companyToEdit = companies.find((company) => company.id === id);
    
    if (!companyToEdit) {
      logger.error(`Company with ID ${id} not found for editing`);
      
      // Try to find a company with a similar ID (in case of string vs UUID format issues)
      const similarCompany = companies.find((company) => 
        company.id.includes(id) || id.includes(company.id)
      );
      
      if (similarCompany) {
        logger.info(`Found similar company with ID ${similarCompany.id}`);
        setNewCompany({
          id: similarCompany.id,
          name: typeof similarCompany.name === 'string' ? { en: similarCompany.name } : similarCompany.name,
          email: similarCompany.email || "",
          phone: similarCompany.phone || "",
          city: typeof similarCompany.city === 'string' ? { en: similarCompany.city } : similarCompany.city,
          country: typeof similarCompany.country === 'string' ? { en: similarCompany.country } : similarCompany.country,
          description: typeof similarCompany.description === 'string' ? { en: similarCompany.description } : similarCompany.description,
          address: typeof similarCompany.address === 'string' ? { en: similarCompany.address } : similarCompany.address,
          logoUrl: similarCompany.logoUrl || "",
          color: similarCompany.color || "#b69b83",
          industries: similarCompany.industries || []
        });
        
        // Set edit mode and open dialog
        setIsEditMode(true);
        setIsAddDialogOpen(true);
        return;
      }
      
      toast({
        title: "Company not found",
        description: "The company you're trying to edit could not be found",
        variant: "destructive",
      });
      return;
    }
    
    // Set the form values to the company being edited
    setNewCompany({
      id: companyToEdit.id,
      name: typeof companyToEdit.name === 'string' ? { en: companyToEdit.name } : companyToEdit.name,
      email: companyToEdit.email || "",
      phone: companyToEdit.phone || "",
      city: typeof companyToEdit.city === 'string' ? { en: companyToEdit.city } : companyToEdit.city,
      country: typeof companyToEdit.country === 'string' ? { en: companyToEdit.country } : companyToEdit.country,
      description: typeof companyToEdit.description === 'string' ? { en: companyToEdit.description } : companyToEdit.description,
      address: typeof companyToEdit.address === 'string' ? { en: companyToEdit.address } : companyToEdit.address,
      logoUrl: companyToEdit.logoUrl || "",
      color: companyToEdit.color || "#b69b83", // Ensure color is always defined
      industries: companyToEdit.industries || []
    });
    
    // Set edit mode and open dialog
    setIsEditMode(true);
    setIsAddDialogOpen(true);
  };

  const handleLogoChange = (logoUrl: string | null) => {
    setNewCompany({
      ...newCompany,
      logoUrl: logoUrl || "",
    });
  };

  const handleIndustryTagsChange = (tags: IndustryTag[]) => {
    setNewCompany({
      ...newCompany,
      industries: tags
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsAddDialogOpen(open);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Companies</h1>
            <p className="text-gray-500">Manage your companies and their settings</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>{isEditMode ? "Edit Company" : "Add New Company"}</DialogTitle>
                <DialogDescription>
                  {isEditMode 
                    ? "Update the company profile. Click save when you're done."
                    : "Create a new company profile. Click save when you're done."
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <div className="grid gap-6 py-4">
                <MultilingualInput
                  label="Company Name"
                  value={newCompany.name as LocalizedContent}
                  onChange={(value) => setNewCompany({ ...newCompany, name: value })}
                  placeholder="Enter company name"
                  required
                />
                
                <MultilingualInput
                  label="Description"
                  value={newCompany.description as LocalizedContent}
                  onChange={(value) => setNewCompany({ ...newCompany, description: value })}
                  placeholder="Enter company description"
                  type="textarea"
                />
                
                <MultilingualInput
                  label="Address"
                  value={newCompany.address as LocalizedContent}
                  onChange={(value) => setNewCompany({ ...newCompany, address: value })}
                  placeholder="Enter company address"
                />
                
                <MultilingualInput
                  label="City"
                  value={newCompany.city as LocalizedContent}
                  onChange={(value) => setNewCompany({ ...newCompany, city: value })}
                  placeholder="Enter city"
                />
                
                <MultilingualInput
                  label="Country"
                  value={newCompany.country as LocalizedContent}
                  onChange={(value) => setNewCompany({ ...newCompany, country: value })}
                  placeholder="Enter country"
                />
                
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="industries" className="text-right pt-2">
                    Industries
                  </Label>
                  <div className="col-span-3">
                    <IndustryTagSelect 
                      selectedTags={newCompany.industries || []}
                      onTagsChange={handleIndustryTagsChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCompany.email}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, email: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={newCompany.phone}
                    onChange={(e) =>
                      setNewCompany({ ...newCompany, phone: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="logo" className="text-right pt-2">
                    Logo
                  </Label>
                  <div className="col-span-3">
                    <CompanyLogoUpload 
                      initialLogo={newCompany.logoUrl}
                      onLogoChange={handleLogoChange}
                      companyId={isEditMode ? newCompany.id : undefined}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="color" className="text-right">
                    Brand Color
                  </Label>
                  <div className="flex col-span-3 gap-2">
                    <Input
                      id="color"
                      type="color"
                      value={newCompany.color}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, color: e.target.value })
                      }
                      className="w-12 h-10 p-1"
                    />
                    <Input
                      value={newCompany.color}
                      onChange={(e) =>
                        setNewCompany({ ...newCompany, color: e.target.value })
                      }
                      className="flex-1"
                    />
                  </div>
                </div>
                </div>
              </div>
              <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddCompany} disabled={!newCompany.name || (typeof newCompany.name === 'object' && !newCompany.name.en)}>
                  {isEditMode ? "Update Company" : "Save Company"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search className="h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">View:</span>
            <Tabs
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode["value"])}
              className="w-[200px]"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grid">
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="list">
                  <LayoutList className="mr-2 h-4 w-4" />
                  List
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : viewMode === "list" ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.length > 0 ? (
                  Array.isArray(filteredCompanies) && filteredCompanies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {company.logoUrl ? (
                              <img
                                src={company.logoUrl}
                                alt={company.name}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  logger.warn(`Logo failed to load for company: ${company.name}`);
                                  const target = e.target as HTMLImageElement;
                                  // Replace with Building icon
                                  target.style.display = 'none';
                                  target.parentElement?.classList.add('flex', 'items-center', 'justify-center');
                                  const icon = document.createElement('div');
                                  icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-gray-400"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>';
                                  target.parentElement?.appendChild(icon);
                                }}
                              />
                            ) : (
                              <Building className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          <span>{company.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{company.email}</TableCell>
                      <TableCell>{company.phone}</TableCell>
                      <TableCell>
                        {company.city}, {company.country}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleEditCompany(company.id)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCompanyToDelete(company)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No companies found. Add your first company to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompanies.length > 0 ? (
              Array.isArray(filteredCompanies) && filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onEdit={() => handleEditCompany(company.id)}
                  onDelete={() => setCompanyToDelete(company)}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8 border rounded-md">
                No companies found. Add your first company to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={!!companyToDelete} onOpenChange={(open) => !open && setCompanyToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{companyToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteCompany}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
} 