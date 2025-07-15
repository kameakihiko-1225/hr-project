import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X, ChevronDown, Home, Phone, BriefcaseBusiness, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSelector } from './ui/LanguageSelector';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();

  // Handle scroll event to change header appearance
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  // Close mobile menu when switching to desktop view
  useEffect(() => {
    if (!isMobile && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMobile, isMenuOpen]);

  const { t } = useTranslation();
  
  // Function to scroll to a section by ID
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    }
  };

  const menuItems = [
    { key: 'home', href: '/', action: () => scrollToSection('hero-section'), icon: Home },
    { key: 'blog', href: '/blog', action: null, icon: Images },
    { key: 'contact', href: null, action: () => scrollToSection('contact'), icon: Phone },
  ];

  return (
    <header 
      className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div 
              className="flex items-center cursor-pointer"
              onClick={() => scrollToSection("hero-section")}
            >
              <img src="/logo%20png.png" alt="Millat Umidi HR Logo" className="h-16 w-16 object-contain mr-3" />
              <span className="text-3xl font-bold tracking-tight" style={{ color: '#222' }}>
                Millat Umidi Group
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {menuItems.map((item) => (
              <div key={item.key} className="relative">
                <a
                  href={item.href}
                  onClick={(e) => {
                    if (item.action) {
                      e.preventDefault();
                      item.action();
                    }
                  }}
                  className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  {t(item.key)}
                </a>
              </div>
            ))}
            {/* Apply Now button */}
            <Button 
              onClick={() => scrollToSection("filter-section")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {t('apply_now')}
            </Button>
            {/* Language Selector */}
            <LanguageSelector className="ml-4" />
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => scrollToSection("contact")}
              className="rounded-full h-9 w-9 text-gray-700 hover:text-blue-600 hover:bg-transparent"
              aria-label="Contact"
            >
              <Phone className="h-5 w-5" />
            </Button>
            <Button 
              size="sm"
              onClick={() => scrollToSection("filter-section")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <BriefcaseBusiness className="h-4 w-4 mr-1" />
              Apply
            </Button>
            {/* Language Selector for mobile */}
            <LanguageSelector className="ml-2" />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen 
              ? 'max-h-64 opacity-100 border-t border-gray-200' 
              : 'max-h-0 opacity-0 border-t border-transparent'
          }`}
        >
          <div className="py-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key}>
                  <a
                    href={item.href}
                    onClick={(e) => {
                      if (item.action) {
                        e.preventDefault();
                        item.action();
                      }
                    }}
                    className="flex items-center px-4 py-3 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    {Icon && <Icon className="h-5 w-5 mr-3" />}
                    {t(item.key)}
                  </a>
                </div>
              );
            })}
            
            <div className="px-4 py-4 flex flex-col gap-2">
              <Button 
                onClick={() => scrollToSection("filter-section")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {t('apply_now')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
