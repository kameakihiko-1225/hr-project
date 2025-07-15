import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Award, Coffee, Lightbulb, Target, Images } from "lucide-react";

interface GalleryImage {
  id: number;
  title: string;
  description: string;
  category: 'teamwork' | 'culture' | 'workspace' | 'events';
  imageUrl: string;
  tags: string[];
}

// Mock gallery data showcasing team culture and collaboration
const galleryImages: GalleryImage[] = [
  {
    id: 1,
    title: "Daily Team Stand-up",
    description: "Our cross-functional teams collaborate daily to ensure everyone is aligned on our educational mission.",
    category: 'teamwork',
    imageUrl: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80",
    tags: ["collaboration", "agile", "communication"]
  },
  {
    id: 2,
    title: "Innovation Workshop",
    description: "Regular brainstorming sessions where every team member's ideas are valued and explored.",
    category: 'culture',
    imageUrl: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    tags: ["innovation", "creativity", "ideation"]
  },
  {
    id: 3,
    title: "Modern Learning Spaces",
    description: "Our office design promotes collaboration with open spaces, meeting pods, and comfortable work areas.",
    category: 'workspace',
    imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80",
    tags: ["workspace", "design", "comfort"]
  },
  {
    id: 4,
    title: "Team Celebration",
    description: "We celebrate every milestone and success together, fostering a culture of recognition and appreciation.",
    category: 'events',
    imageUrl: "https://images.unsplash.com/photo-1511578314322-379afb476865?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80",
    tags: ["celebration", "recognition", "team-building"]
  },
  {
    id: 5,
    title: "Mentorship Program",
    description: "Experienced team members mentor newcomers, creating a supportive learning environment.",
    category: 'culture',
    imageUrl: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1474&q=80",
    tags: ["mentorship", "learning", "support"]
  },
  {
    id: 6,
    title: "Coffee & Code Sessions",
    description: "Informal coding sessions over coffee where teams share knowledge and solve problems together.",
    category: 'teamwork',
    imageUrl: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1587&q=80",
    tags: ["collaboration", "learning", "informal"]
  },
  {
    id: 7,
    title: "Company Retreat",
    description: "Annual company retreats where we bond as a team and plan our future educational initiatives.",
    category: 'events',
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    tags: ["retreat", "planning", "bonding"]
  },
  {
    id: 8,
    title: "Flexible Work Environment",
    description: "We support work-life balance with flexible schedules and remote work options when needed.",
    category: 'workspace',
    imageUrl: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80",
    tags: ["flexibility", "balance", "comfort"]
  },
  {
    id: 9,
    title: "Cross-Department Collaboration",
    description: "Regular cross-department projects ensure knowledge sharing and unified vision across all teams.",
    category: 'teamwork',
    imageUrl: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80",
    tags: ["cross-functional", "collaboration", "unity"]
  }
];

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

export default function Gallery() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  const categories = [
    { key: 'all', label: 'All', icon: Target },
    { key: 'teamwork', label: 'Teamwork', icon: Users },
    { key: 'culture', label: 'Culture', icon: Heart },
    { key: 'workspace', label: 'Workspace', icon: Coffee },
    { key: 'events', label: 'Events', icon: Award }
  ];

  const filteredImages = selectedCategory === 'all' 
    ? galleryImages 
    : galleryImages.filter(img => img.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Header />
      
      <main className="relative">
        {/* Hero Section */}
        <section className="relative py-20 px-4 md:py-24 md:px-6 bg-white dark:bg-gray-950 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Images className="h-4 w-4 mr-2" />
                Our Team & Culture
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Life at Millat Umidi
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Discover how we work together as a team to create exceptional educational experiences 
                and build a culture of collaboration, innovation, and growth.
              </p>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map((category) => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.key;
                return (
                  <Button
                    key={category.key}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.key)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all ${
                      isActive 
                        ? "bg-blue-600 text-white shadow-lg" 
                        : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border-gray-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {category.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Gallery Grid */}
        <section className="relative py-16 px-4 md:px-6 bg-white dark:bg-gray-950 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredImages.map((image) => {
                const CategoryIcon = categoryIcons[image.category];
                return (
                  <Card 
                    key={image.id}
                    className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="relative overflow-hidden">
                      <img
                        src={image.imageUrl}
                        alt={image.title}
                        className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className={`flex items-center gap-1 ${categoryColors[image.category]} border`}>
                          <CategoryIcon className="h-3 w-3" />
                          {image.category}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {image.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {image.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {image.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Culture Values Section */}
        <section className="relative py-20 px-4 md:py-24 md:px-6 bg-white dark:bg-gray-950 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Core Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                These values guide how we work together and treat each other every day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Users,
                  title: "Collaboration First",
                  description: "We believe great things happen when diverse minds work together towards a common goal."
                },
                {
                  icon: Heart,
                  title: "Care & Respect",
                  description: "Every team member is treated with dignity, respect, and genuine care for their wellbeing."
                },
                {
                  icon: Lightbulb,
                  title: "Continuous Learning",
                  description: "We encourage curiosity, provide learning opportunities, and celebrate growth at every level."
                },
                {
                  icon: Award,
                  title: "Excellence & Impact",
                  description: "We strive for high-quality work that makes a meaningful difference in education."
                },
                {
                  icon: Coffee,
                  title: "Work-Life Balance",
                  description: "We support flexible work arrangements and understand the importance of personal time."
                },
                {
                  icon: Target,
                  title: "Purpose-Driven",
                  description: "Everything we do is guided by our mission to improve educational opportunities."
                }
              ].map((value, index) => {
                const Icon = value.icon;
                return (
                  <Card key={index} className="p-8 text-center border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">
                      {value.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {value.description}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Image Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div 
              className="max-w-4xl max-h-[90vh] overflow-auto bg-white rounded-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                className="w-full h-96 object-cover"
              />
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Badge className={`flex items-center gap-1 ${categoryColors[selectedImage.category]} border`}>
                    {React.createElement(categoryIcons[selectedImage.category], { className: "h-3 w-3" })}
                    {selectedImage.category}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedImage.title}
                </h2>
                <p className="text-gray-600 leading-relaxed mb-6">
                  {selectedImage.description}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedImage.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <Button 
                  onClick={() => setSelectedImage(null)}
                  className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}