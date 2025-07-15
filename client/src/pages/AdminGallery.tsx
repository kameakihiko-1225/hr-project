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
import { insertGalleryItemSchema, type GalleryItem, type InsertGalleryItem } from '@shared/schema';
import { AdminLayout } from '@/components/admin/AdminLayout';

const categories = [
  { value: 'teamwork', label: 'Team Collaboration' },
  { value: 'culture', label: 'Company Culture' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'events', label: 'Events' }
];

export default function AdminGallery() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch gallery items
  useEffect(() => {
    const fetchGalleryItems = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/gallery');
        const data = await response.json();
        
        if (data.success) {
          setGalleryItems(data.data);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch gallery items",
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch gallery items",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryItems();
  }, [toast]);

  const createGalleryItem = async (data: InsertGalleryItem) => {
    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        setGalleryItems([...galleryItems, result.data]);
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Gallery item created successfully"
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create gallery item",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create gallery item",
        variant: "destructive"
      });
    }
  };

  const updateGalleryItem = async (id: number, data: Partial<InsertGalleryItem>) => {
    try {
      const response = await fetch(`/api/gallery/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (result.success) {
        setGalleryItems(galleryItems.map(item => 
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
        setGalleryItems(galleryItems.filter(item => item.id !== id));
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
        setGalleryItems(galleryItems.map(item => 
          item.id === id ? { ...item, isActive: !isActive } : item
        ));
        toast({
          title: "Success",
          description: "Gallery item visibility updated"
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
      title: '',
      description: '',
      category: 'teamwork',
      imageUrl: '',
      tags: [],
      isActive: true,
      sortOrder: 0
    }
  });

  const handleSubmit = (data: InsertGalleryItem) => {
    if (editingItem) {
      updateGalleryItem(editingItem.id, data);
    } else {
      createGalleryItem(data);
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    form.reset({
      title: item.title,
      description: item.description,
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
                    title: '',
                    description: '',
                    category: 'teamwork',
                    imageUrl: '',
                    tags: [],
                    isActive: true,
                    sortOrder: 0
                  });
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Gallery Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Edit Gallery Item' : 'Add Gallery Item'}
                </DialogTitle>
                <DialogDescription>
                  {editingItem ? 'Update the gallery item details' : 'Create a new gallery item to showcase team culture'}
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter gallery item title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter gallery item description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                        <FormLabel>Image URL</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter image URL" type="url" />
                        </FormControl>
                        <FormDescription>
                          Enter the URL of the image for this gallery item
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
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galleryItems.map((item) => (
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
                    alt={item.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmM2Y0ZjYiLz48dGV4dCB4PSI1MCIgeT0iMTA1IiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM2YjczODAiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
                <CardTitle className="text-lg">{item.title}</CardTitle>
                <CardDescription className="text-sm">
                  {categories.find(c => c.value === item.category)?.label}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {item.description}
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

        {galleryItems.length === 0 && (
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