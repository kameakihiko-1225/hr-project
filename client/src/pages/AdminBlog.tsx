import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { insertGalleryItemSchema, type GalleryItem, type InsertGalleryItem, type LocalizedContent } from '@shared/schema';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MultilingualInput } from '@/components/ui/multilingual-input';
import { useTranslation } from 'react-i18next';

const categories = [
  { value: 'teamwork', label: 'Team Collaboration' },
  { value: 'culture', label: 'Company Culture' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'events', label: 'Events' }
];

export default function AdminBlog() {
  const [blogItems, setBlogItems] = useState<GalleryItem[]>([]);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { i18n } = useTranslation();

  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  };

  // Fetch blog items
  useEffect(() => {
    const fetchBlogItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/gallery');
        const data = await response.json();
        
        if (data.success) {
          setBlogItems(data.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch blog items",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch blog items",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchBlogItems();
  }, [toast]);

  const createBlogItem = async (data: InsertGalleryItem, file?: File) => {
    try {
      const formData = new FormData();
      
      // Add file if provided
      if (file) {
        formData.append('file', file);
      }
      
      // Add other data fields
      Object.keys(data).forEach(key => {
        const value = data[key as keyof InsertGalleryItem];
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          // Handle LocalizedContent objects by JSON stringifying them
          if (typeof value === 'object' && value !== null) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData, // Use FormData instead of JSON
      });

      const result = await response.json();
      if (result.success) {
        setBlogItems([...blogItems, result.data]);
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Blog item created successfully"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create blog item",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create blog item",
        variant: "destructive"
      });
    }
  };

  const updateGalleryItem = async (id: number, data: Partial<InsertGalleryItem>, file?: File) => {
    try {
      const formData = new FormData();
      
      // Add file if provided
      if (file) {
        formData.append('file', file);
      }
      
      // Add other data fields
      Object.keys(data).forEach(key => {
        const value = data[key as keyof InsertGalleryItem];
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          // Handle LocalizedContent objects by JSON stringifying them
          if (typeof value === 'object' && value !== null) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      const response = await fetch(`/api/gallery/${id}`, {
        method: 'PUT',
        body: formData, // Use FormData instead of JSON
      });

      const result = await response.json();
      if (result.success) {
        setBlogItems(blogItems.map(item => 
          item.id === id ? { ...item, ...result.data } : item
        ));
        setIsDialogOpen(false);
        setEditingItem(null);
        toast({
          title: "Success",
          description: "Gallery item updated successfully"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update gallery item",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update gallery item",
        variant: "destructive"
      });
    }
  };

  const deleteGalleryItem = async (id: number) => {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        setBlogItems(blogItems.filter(item => item.id !== id));
        toast({
          title: "Success",
          description: "Gallery item deleted successfully"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete gallery item",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gallery item",
        variant: "destructive"
      });
    }
  };

  const toggleActiveStatus = async (id: number, isActive: boolean) => {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      const result = await response.json();
      if (result.success) {
        setBlogItems(blogItems.map(item => 
          item.id === id ? { ...item, isActive: !isActive } : item
        ));
        toast({
          title: "Success",
          description: "Blog item visibility updated"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update gallery item visibility",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update gallery item visibility",
        variant: "destructive"
      });
    }
  };

  const form = useForm<InsertGalleryItem>({
    resolver: zodResolver(insertGalleryItemSchema),
    defaultValues: {
      title: { en: '' } as LocalizedContent,
      description: { en: '' } as LocalizedContent,
      category: 'teamwork',
      imageUrl: '',
      tags: [],
      isActive: true,
      sortOrder: 0
    }
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleSubmit = (data: InsertGalleryItem) => {
    if (editingItem) {
      updateGalleryItem(editingItem.id, data, selectedFile || undefined);
    } else {
      createBlogItem(data, selectedFile || undefined);
    }
    setSelectedFile(null);
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    form.reset({
      title: typeof item.title === 'string' ? { en: item.title } : item.title as LocalizedContent,
      description: typeof item.description === 'string' ? { en: item.description } : item.description as LocalizedContent,
      category: item.category,
      imageUrl: item.imageUrl,
      tags: item.tags || [],
      isActive: item.isActive,
      sortOrder: item.sortOrder
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this gallery item?')) {
      deleteGalleryItem(id);
    }
  };

  const handleToggleActive = (id: number, isActive: boolean) => {
    toggleActiveStatus(id, isActive);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Gallery Management</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingItem(null);
                  form.reset({
                    title: { en: '' } as LocalizedContent,
                    description: { en: '' } as LocalizedContent,
                    category: 'teamwork',
                    imageUrl: '',
                    tags: [],
                    isActive: true,
                    sortOrder: 0
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Blog Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>
                  {editingItem ? 'Edit Blog Item' : 'Add Blog Item'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the blog item details' : 'Create a new blog item to showcase team culture'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="space-y-4">
                    <MultilingualInput
                      label="Blog Title"
                      value={form.watch('title') as LocalizedContent}
                      onChange={(value) => form.setValue('title', value)}
                      placeholder="Enter blog item title"
                      required
                    />
                    
                    <MultilingualInput
                      label="Description"
                      value={form.watch('description') as LocalizedContent}
                      onChange={(value) => form.setValue('description', value)}
                      placeholder="Enter blog item description"
                      type="textarea"
                      required
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Image</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setSelectedFile(file);
                                  // Create a URL for the uploaded file
                                  const fileUrl = URL.createObjectURL(file);
                                  field.onChange(fileUrl);
                                }
                              }}
                            />
                            <div className="text-sm text-gray-500">Or</div>
                            <Input 
                              placeholder="https://example.com/image.jpg" 
                              value={field.value || ''}
                              onChange={field.onChange}
                              type="url"
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload an image file or enter an image URL
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sort Order</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            placeholder="0" 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Lower numbers appear first (0 = first, 1 = second, etc.)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
                </Form>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogItems.map((item) => (
            <Card key={item.id} className="relative">
              <div className="absolute top-2 right-2 z-10">
                <Badge variant={item.isActive ? "default" : "secondary"}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <CardHeader className="pb-3">
                <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden mb-3">
                  <img
                    src={item.imageUrl}
                    alt={getLocalizedContent(item.title)}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCIgeT0iMTA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjczODAiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
                <CardTitle className="text-lg">{getLocalizedContent(item.title)}</CardTitle>
                <CardDescription className="text-sm">
                  {categories.find(c => c.value === item.category)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {getLocalizedContent(item.description)}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(item.id, item.isActive)}
                    >
                      {item.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Order: {item.sortOrder}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {blogItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No gallery items found. Create your first gallery item to get started.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}