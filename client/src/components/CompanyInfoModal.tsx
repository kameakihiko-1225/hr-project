import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Building, Globe } from "lucide-react";
import { Company } from "@shared/schema";
import { useTranslation } from 'react-i18next';
import { LocalizedContent } from "@shared/schema";

interface CompanyInfoModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyInfoModal({ company, isOpen, onClose }: CompanyInfoModalProps) {
  const { i18n } = useTranslation();
  
  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  };
  
  console.log('CompanyInfoModal rendered:', { company, isOpen });
  
  if (!company) {
    console.log('No company data provided to modal');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {company.logoUrl && (
              <img 
                src={company.logoUrl} 
                alt={`${getLocalizedContent(company.name)} logo`}
                className="h-12 w-12 rounded-lg object-contain p-1 border"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold">{getLocalizedContent(company.name)}</h2>
              <p className="text-sm text-muted-foreground">Company Information</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {company.description && (
            <div>
              <h3 className="font-medium mb-2">About</h3>
              <p className="text-sm text-muted-foreground">{getLocalizedContent(company.description)}</p>
            </div>
          )}

          {/* Industry Tags */}
          {company.industries && company.industries.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Industry</h3>
              <div className="flex flex-wrap gap-2">
                {company.industries.map((industry) => (
                  <Badge key={industry.id} variant="outline" className="text-xs">
                    {industry.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="grid grid-cols-1 gap-3">
            {/* Show only one location - prefer address over city/country, or combine them */}
            {(company.address || (company.city && company.country)) && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {getLocalizedContent(company.address) || `${getLocalizedContent(company.city)}, ${getLocalizedContent(company.country)}`}
                </span>
              </div>
            )}

            {company.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{company.phone}</span>
              </div>
            )}

            {company.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{company.email}</span>
              </div>
            )}
          </div>

          {/* Company Color */}
          {company.color && (
            <div className="flex items-center gap-2 text-sm">
              <div 
                className="w-4 h-4 rounded-full border"
                style={{ backgroundColor: company.color }}
              />
              <span>Brand Color</span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}