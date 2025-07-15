import { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
  disabled?: boolean;
}

export const MultiSelect = ({ options, selected, onChange, placeholder, disabled = false }: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Ensure dropdown stays in view
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      
      if (rect.bottom > viewportHeight) {
        dropdownRef.current.style.maxHeight = `${viewportHeight - rect.top - 20}px`;
      }
    }
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
    
    // Close dropdown on mobile devices after selection
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const removeSelected = (option: string) => {
    onChange(selected.filter(item => item !== option));
  };

  const handleMouseEnter = () => {
    // Cancel any pending close operation
    if (closeTimeoutRef.current) {
      window.clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    // Only close on mouse leave for desktop with a delay
    if (window.innerWidth >= 768 && isOpen) {
      closeTimeoutRef.current = window.setTimeout(() => {
        setIsOpen(false);
      }, 500); // 500ms delay before closing
    }
  };

  return (
    <div 
      className="relative" 
      ref={containerRef} 
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      <div
        className={`
          min-h-[48px] p-3 border-2 border-gray-200 rounded-lg bg-white
          cursor-pointer transition-all duration-300 hover:border-blue-300 focus-within:border-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}
          ${isOpen ? 'border-blue-500 shadow-lg shadow-blue-100' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {selected.length > 0 ? (
              selected.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 
                           border border-blue-200 rounded-md text-sm text-blue-800"
                >
                  {item}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSelected(item);
                    }}
                    className="text-blue-600 hover:text-blue-800 transition-colors ml-1"
                    aria-label={`Remove ${item}`}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto 
                     bg-white border border-gray-200 rounded-lg shadow-xl z-[60] animate-fade-in"
          onMouseEnter={handleMouseEnter}
        >
          <div className="sticky top-0 bg-white border-b border-gray-200 p-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              {selected.length > 0 ? `${selected.length} selected` : 'Select options'}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(false);
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              aria-label="Close dropdown"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          {options.length > 0 ? (
            options.map((option) => (
              <div
                key={option}
                className={`
                  px-4 py-3 cursor-pointer transition-all duration-200 hover:bg-blue-50
                  ${selected.includes(option) ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
                `}
                onClick={() => toggleOption(option)}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {selected.includes(option) && (
                    <span className="text-blue-600">✓</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 text-center">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
};
