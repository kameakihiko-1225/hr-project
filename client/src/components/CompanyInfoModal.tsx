import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Building, Globe } from "lucide-react";
import { Company, CompanyWithIndustries } from "@shared/schema";
import { useTranslation } from 'react-i18next';
import { LocalizedContent } from "@shared/schema";

interface CompanyInfoModalProps {
  company: CompanyWithIndustries | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyInfoModal({ company, isOpen, onClose }: CompanyInfoModalProps) {
  const { i18n, t } = useTranslation();
  
  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent | null): string => {
    if (!content) return '';
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
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 sm:gap-3">
            {company.logoUrl && (
              <img 
                src={company.logoUrl} 
                alt={`${getLocalizedContent(company.name)} logo`}
                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-contain p-1 border"
              />
            )}
            <div>
              <h2 className="text-lg sm:text-xl font-semibold leading-tight">{getLocalizedContent(company.name)}</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">{t('modals.company_info.title')}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Description */}
          {company.description && (
            <div>
              <h3 className="font-medium mb-2">{t('modals.company_info.about')}</h3>
              <p className="text-sm text-muted-foreground">{getLocalizedContent(company.description)}</p>
            </div>
          )}

          {/* Industry Tags */}
          {company.industries && company.industries.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">{t('modals.company_info.industry')}</h3>
              <div className="flex flex-wrap gap-2">
                {company.industries.map((industry: any) => (
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
              <span>{t('modals.company_info.brand_color')}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            {t('modals.company_info.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}