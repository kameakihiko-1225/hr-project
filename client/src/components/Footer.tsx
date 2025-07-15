import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram } from "lucide-react";

export const Footer = () => {
  // Function to scroll to a section by ID with enhanced smoothness
  const scrollToSection = (id: string | null) => {
    if (id) {
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ 
          behavior: "smooth", 
          block: "start" 
        });
      }
    } else {
      // Smooth scroll to top with animation
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };

  return (
    <footer className="flex flex-col items-center justify-center py-6 border-t border-border bg-white">
      <img src="/2025-07-14 1.05.36 PM.jpg" alt="Millat Umidi HR Logo" className="h-20 w-20 object-contain mb-2" />
      <span className="text-lg font-semibold" style={{ color: '#222' }}>
        Millat Umidi Group
      </span>
      <span className="text-xs text-gray-500 mt-1">&copy; {new Date().getFullYear()} Millat Umidi Group. All rights reserved.</span>
    </footer>
  );
};
