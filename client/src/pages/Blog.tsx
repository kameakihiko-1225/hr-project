import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Heart, Award, Coffee, Lightbulb, Target, Images, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { type GalleryItem } from "@shared/schema";
import SEOHead from "@/components/SEOHead";
import { getPageSEO } from "@/utils/seoUtils";

const categoryIcons = {
  teamwork: Users,
  culture: Heart,
  workspace: Coffee,
  events: Award
};

const categoryColors = {
  teamwork: "bg-blue-100 text-blue-700 border-blue-200",
  culture: "bg-red-100 text-red-700 border-red-200",
  workspace: "bg-green-100 text-green-700 border-green-200",
  events: "bg-purple-100 text-purple-700 border-purple-200"
};

export default function Blog() {
  const { t, i18n } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const seoData = getPageSEO('blog', i18n.language);

  // Fetch blog items from API
  const { data: blogResponse, isLoading, error } = useQuery({
    queryKey: ['blog', 'gallery-items'],
    queryFn: async () => {
      const response = await fetch('/api/gallery', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      const data = await response.json();
      console.log('Blog API response:', data);
      return data;
    },
    staleTime: 0, // Always refetch
    gcTime: 0, // Don't cache
  });

  const blogItems: GalleryItem[] = blogResponse?.data || [];
  
  console.log('Blog data debug:', {
    blogResponse,
    blogItems,
    blogItemsLength: blogItems.length,
    filteredItemsLength: blogItems.length
  });



  const categories = [
    { key: 'all', label: t('blog.categories.all'), icon: Target },
    { key: 'teamwork', label: t('blog.categories.teamwork'), icon: Users },
    { key: 'culture', label: t('blog.categories.culture'), icon: Heart },
    { key: 'workspace', label: t('blog.categories.workspace'), icon: Coffee },
    { key: 'events', label: t('blog.categories.events'), icon: Award }
  ];

  const filteredItems = selectedCategory === 'all' 
    ? blogItems 
    : blogItems.filter(item => item.category === selectedCategory);

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when category changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">{t('blog.loading')}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEOHead 
        title={seoData.title}
        description={seoData.description}
        keywords={seoData.keywords}
        canonical={seoData.canonical}
        type="website"
      />
      <Header />
      
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Images className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('blog.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('blog.description')}
            </p>
          </div>
        </div>
      </section>

      {/* Gallery Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-12">
              <TabsList className="grid w-full grid-cols-5 lg:w-fit lg:grid-cols-5 mx-auto mb-8">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <TabsTrigger 
                      key={category.key} 
                      value={category.key}
                      className="flex items-center space-x-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{category.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {/* Gallery Grid */}
              <TabsContent value={selectedCategory} className="mt-0">
                {filteredItems.length === 0 ? (
                  <div className="text-center py-16">
                    <Images className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('blog.noPostsFound')}</h3>
                    <p className="text-gray-500">
                      {selectedCategory === 'all' 
                        ? t('blog.noPostsAvailable')
                        : t('blog.noPostsInCategory', { category: selectedCategory })}
                    </p>
                    <div className="mt-4">
                      <p className="text-sm text-gray-400">
                        API Response: {JSON.stringify(blogResponse)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {paginatedItems.map((item, index) => {
                      const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || Target;
                      return (
                        <Card 
                          key={item.id} 
                          className="group cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden border-0 shadow-lg"
                          onClick={() => setSelectedImage(item)}
                        >
                          <div className="relative overflow-hidden">
                            <img 
                              src={item.imageUrl} 
                              alt={typeof item.title === 'string' ? item.title : item.title.en || ''}
                              className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1374&q=80';
                              }}
                            />
                            <div className="absolute top-4 left-4">
                              <Badge 
                                variant="secondary" 
                                className={`${categoryColors[item.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-700'} flex items-center space-x-1`}
                              >
                                <Icon className="h-3 w-3" />
                                <span className="capitalize">{item.category}</span>
                              </Badge>
                            </div>
                          </div>
                          <CardContent className="p-6">
                            <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-600 transition-colors">
                              {typeof item.title === 'string' ? item.title : item.title.en || ''}
                            </h3>
                            <p className="text-gray-600 mb-4 line-clamp-3">
                              {typeof item.description === 'string' ? item.description : item.description.en || ''}
                            </p>
                          </CardContent>
                        </Card>
                      );
                      })}
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center space-x-2 mt-12">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="flex items-center space-x-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span>{t('blog.pagination.previous')}</span>
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          ))}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="flex items-center space-x-1"
                        >
                          <span>{t('blog.pagination.next')}</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <img 
                src={selectedImage.imageUrl} 
                alt={selectedImage.title}
                className="w-full h-auto max-h-[60vh] object-contain"
              />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
              >
                <span className="sr-only">Close</span>
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-3">
                <Badge 
                  variant="secondary" 
                  className={`${categoryColors[selectedImage.category as keyof typeof categoryColors] || 'bg-gray-100 text-gray-700'} flex items-center space-x-1`}
                >
                  {React.createElement(categoryIcons[selectedImage.category as keyof typeof categoryIcons] || Target, { className: "h-3 w-3" })}
                  <span className="capitalize">{selectedImage.category}</span>
                </Badge>
              </div>
              <h2 className="text-2xl font-bold mb-3">{selectedImage.title}</h2>
              <p className="text-gray-600 mb-4">{selectedImage.description}</p>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}