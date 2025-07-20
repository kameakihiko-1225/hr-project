import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Menu, X, ChevronDown, Home, Phone, BriefcaseBusiness, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { LanguageSelector } from './ui/LanguageSelector';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isMobile = useIsMobile();
  const [location] = useLocation();

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
  
  // Function to scroll to a section by ID or navigate to home
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      if (isMenuOpen) {
        setIsMenuOpen(false);
      }
    }
  };

  // Function to handle logo click - redirect to home or scroll to hero
  const handleLogoClick = () => {
    if (location === '/') {
      scrollToSection("hero-section");
    } else {
      window.location.href = '/';
    }
  };

  // Filter menu items based on current location
  const allMenuItems = [
    { key: 'home', href: '/', action: null, icon: Home },
    { key: 'blog', href: '/blog', action: null, icon: Images },
    { key: 'contact', href: null, action: () => scrollToSection('contact'), icon: Phone },
  ];

  // Hide Home button when on main page
  const menuItems = location === '/' 
    ? allMenuItems.filter(item => item.key !== 'home')
    : allMenuItems;

  return (
    <header 
      className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-md' : 'shadow-sm border-b border-gray-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div 
              className="flex items-center cursor-pointer"
              onClick={handleLogoClick}
            >
              <img src="/logo%20png.png" alt="Millat Umidi HR Logo" className="h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 object-contain mr-2 sm:mr-3" />
              <div className="flex flex-col">
                <span className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight hidden xs:block" style={{ color: '#222' }}>
                  <span className="hidden sm:inline">{t('company_career_full')}</span>
                  <span className="sm:hidden">{t('company_career_short')}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
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
                  className="flex items-center text-gray-700 hover:text-blue-600 px-4 py-2 text-sm font-medium transition-colors hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 rounded-md"
                >
                  {t(item.key)}
                </a>
              </div>
            ))}
            {/* Apply Now button */}
            <Button 
              onClick={() => scrollToSection("filter-section")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 ml-2"
            >
              {t('apply_now')}
            </Button>
            {/* Language Selector */}
            <LanguageSelector className="ml-6" />
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-1 sm:gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => scrollToSection("contact")}
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9 text-gray-700 hover:text-blue-600 hover:bg-transparent"
              aria-label="Contact"
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
            <Button 
              size="sm"
              onClick={() => scrollToSection("filter-section")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm"
            >
              <BriefcaseBusiness className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
              <span className="hidden xs:inline">Apply</span>
            </Button>
            {/* Language Selector for mobile */}
            <LanguageSelector className="ml-1 sm:ml-2" />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-1.5 sm:p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
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
