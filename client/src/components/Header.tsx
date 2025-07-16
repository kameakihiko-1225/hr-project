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
  const { t } = useTranslation();

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div 
              className="flex items-center cursor-pointer"
              onClick={handleLogoClick}
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
                  <item.icon className="h-4 w-4 mr-2" />
                  {t(`navigation.${item.key}`)}
                </a>
              </div>
            ))}
          </nav>

          {/* Language Selector and Mobile Menu Button */}
          <div className="hidden md:flex items-center space-x-4">
            <LanguageSelector />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <LanguageSelector className="mr-2" />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {menuItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                onClick={(e) => {
                  if (item.action) {
                    e.preventDefault();
                    item.action();
                  }
                  setIsMenuOpen(false);
                }}
                className="flex items-center text-gray-700 hover:text-blue-600 hover:bg-gray-50 px-3 py-2 rounded-md text-base font-medium transition-colors"
              >
                <item.icon className="h-5 w-5 mr-3" />
                {t(`navigation.${item.key}`)}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};