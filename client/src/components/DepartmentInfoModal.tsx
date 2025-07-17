import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, Mail, Building, Users, Globe } from "lucide-react";
import { Department, Company } from "@shared/schema";
import { useTranslation } from 'react-i18next';
import { LocalizedContent } from "@shared/schema";

interface DepartmentInfoModalProps {
  department: Department | null;
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DepartmentInfoModal({ department, company, isOpen, onClose }: DepartmentInfoModalProps) {
  const { i18n, t } = useTranslation();
  
  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  };
  
  console.log('DepartmentInfoModal rendered:', { department, company, isOpen });
  
  if (!department) {
    console.log('No department data provided to modal');
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {company?.logoUrl && (
              <img 
                src={company.logoUrl} 
                alt={`${getLocalizedContent(company.name)} logo`}
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold">{getLocalizedContent(department.name)}</h2>
              <p className="text-sm text-muted-foreground">
                {t('modals.department_info.department_at')} {company ? getLocalizedContent(company.name) : 'Unknown Company'}
              </p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Department Description */}
          {department.description && (
            <div>
              <h3 className="font-medium mb-2">{t('modals.department_info.about_department')}</h3>
              <p className="text-sm text-muted-foreground">{getLocalizedContent(department.description)}</p>
            </div>
          )}

          {/* Company Information */}
          {company && (
            <div className="border-t pt-4">
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Building className="h-4 w-4" />
                {t('modals.department_info.company_info')}
              </h3>
              
              {company.description && (
                <p className="text-sm text-muted-foreground mb-3">{getLocalizedContent(company.description)}</p>
              )}

              {/* Industry Tags */}
              {company.industryTags && company.industryTags.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-1">{t('modals.department_info.industry')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {company.industryTags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="grid grid-cols-1 gap-2">
                {company.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{getLocalizedContent(company.address)}</span>
                  </div>
                )}
                
                {company.city && company.country && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{getLocalizedContent(company.city)}, {getLocalizedContent(company.country)}</span>
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
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="outline">
            {t('modals.department_info.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}