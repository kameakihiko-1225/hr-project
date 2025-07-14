import { useState, useRef, useEffect } from "react";
import { ArrowLeft, ArrowRight, Star, Quote } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Testimonial data structure
interface Testimonial {
  id: number;
  name: string;
  title: string;
  organization: string;
  image: string;
  quote: string;
  rating: number;
}

// Millat Umidi team stories (Uzbek-style testimonials)
const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ziyoda Rakhmonova",
    title: "English Teacher",
    organization: "Millat Umidi Private School",
    image: "/testimonial-profile.svg",
    quote:
      "\u201CMillat Umidi menga nafaqat yaxshi ish o‘rnini, balki o‘z ustimda ishlash va o‘sish uchun kuchli muhit yaratdi. Dars berish jarayoni zamonaviy texnologiyalar bilan integratsiyalashgan, bu esa bizga va o‘quvchilarga ko‘proq imkoniyatlar yaratadi.\u201D",
    rating: 4.9,
  },
  {
    id: 2,
    name: "Ulug‘bek Mamadaliyev",
    title: "Head of Student Affairs",
    organization: "Millat Umidi University",
    image: "/testimonial-profile.svg",
    quote:
      "\u201CTashkilotda har bir g‘oya qadrlanadi. Millat Umidi universitetida ishlash – bu faqat maosh emas, balki o‘z missiyangni topganing degani. Bu yerda haqiqiy jamoaviy ruh mavjud.\u201D",
    rating: 4.7,
  },
  {
    id: 3,
    name: "Jamshid Qodirov",
    title: "STEM Fanlari Koordinatori",
    organization: "Millat Umidi School System",
    image: "/testimonial-profile.svg",
    quote:
      "\u201CMillat Umidi menga fan va ta’lim sohasida global yondashuv bilan ishlash imkonini berdi. Har bir loyiha – yangi tajriba. Har bir o‘qituvchi – o‘sish yo‘lidagi hamrohingiz.\u201D",
    rating: 4.8,
  },
  {
    id: 4,
    name: "Dilorom Karimova",
    title: "HR Menedjeri",
    organization: "Millat Umidi Group",
    image: "/testimonial-profile.svg",
    quote:
      "\u201CBiz har bir nomzodga individual yondashamiz. Ishga olish jarayonlari tez, tushunarli va insoniy. Bu kompaniyada ishlash — qadriyatlar asosida jamoa bo‘lish demak.\u201D",
    rating: 4.9,
  },
  {
    id: 5,
    name: "Mohira Toshpulatova",
    title: "Maktab Psixologi",
    organization: "Millat Umidi School",
    image: "/testimonial-profile.svg",
    quote:
      "\u201CMen har kuni bolalarning o‘sishiga bevosita hissa qo‘shayotganimni his qilaman. Maktabdagi ijobiy muhit va pedagogik yondashuv o‘quvchilar bilan ishlashni ilhomlantiradi.\u201D",
    rating: 5.0,
  },
  {
    id: 6,
    name: "Shaxzod Xolmatov",
    title: "Professional Development Coordinator",
    organization: "Millat Umidi HR",
    image: "/testimonial-profile.svg",
    quote:
      "\u201CMillat Umidi har bir xodimni o‘stirishga sodiq. Treninglar, ustozlik tizimi va doimiy qo‘llab-quvvatlash orqali biz o‘qituvchilarning yutuqlariga zamin yaratamiz.\u201D",
    rating: 4.8,
  },
];

export const CTASection = () => {
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  // Auto-advance testimonials every 8 seconds
  useEffect(() => {
    if (!api) return;
    
    const interval = setInterval(() => {
      api.scrollNext();
    }, 8000);
    
    return () => clearInterval(interval);
  }, [api]);

  // Function to scroll to a section by ID
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="py-16 md:py-20 bg-gray-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23000000' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          backgroundSize: '100px 100px'
        }}></div>
      </div>
      
      {/* Floating decorative elements */}
      <div className="absolute top-20 left-10 w-16 h-16 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-12 h-12 bg-indigo-100 rounded-full opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-7xl font-bold text-gray-900 mb-4 md:mb-6">
            Stories<span className="text-blue-600">.</span>
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Jamoamiz a’zolari Millat Umidi HR haqida o’z fikr va tajribalari bilan o’rtoqlashmoqda.
          </p>
        </div>

        {/* Testimonials carousel using Shadcn UI */}
        <div className="relative">
          <Carousel
            setApi={setApi}
            className="w-full"
            opts={{
              align: "center",
              loop: true,
            }}
          >
            <CarouselContent>
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id}>
                  <Card className="border-0 shadow-lg">
                    <CardContent className="p-6 md:p-8">
                      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                        {/* Left column with profile */}
                        <div className="md:w-1/4 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0">
                          <Avatar className="w-20 h-20 md:w-24 md:h-24 border-2 border-gray-100">
                            <AvatarImage src={testimonial.image} alt={testimonial.name} />
                            <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="md:mt-4">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900">{testimonial.name}</h3>
                            <p className="text-sm md:text-base text-gray-600 font-medium">{testimonial.title}</p>
                            <Badge variant="outline" className="mt-1">{testimonial.organization}</Badge>
                          </div>
                        </div>
                        
                        {/* Right column with quote */}
                        <div className="md:w-3/4 mt-4 md:mt-0">
                          <div className="relative">
                            <Quote className="h-8 w-8 text-blue-100 absolute -top-4 -left-2 opacity-80" />
                            <blockquote className="text-base md:text-xl text-gray-700 mb-4 md:mb-6 leading-relaxed pl-6">
                              {testimonial.quote}
                            </blockquote>
                          </div>
                          
                          <div className="flex items-center">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i}
                                  className={`h-4 md:h-5 w-4 md:w-5 ${i < Math.floor(testimonial.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="ml-2 text-sm md:text-base text-gray-600">
                              {testimonial.rating.toFixed(1)}/5.0
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </div>
          </Carousel>
        </div>
        
        {/* Pagination dots */}
        <div className="flex justify-center mt-6 md:mt-8 space-x-2">
          {Array.from({ length: count }).map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`h-1.5 md:h-2 rounded-full transition-all ${
                index === current - 1 ? 'bg-blue-600 w-6 md:w-8' : 'bg-gray-300 w-1.5 md:w-2'
              }`}
              aria-label={`Go to testimonial ${index + 1}`}
            />
          ))}
        </div>
        
        {/* CTA Section */}
        <div className="mt-16 md:mt-20 text-center">
          <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 md:mb-6">
            Ready to join these success stories?
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl"
              onClick={() => scrollToSection("filter-section")}
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 rounded-xl"
            >
              View Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
