import { useState } from "react";
import { Building, MoreHorizontal, Pencil, Tag, Trash } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Company } from "@/types/company";
import { createLogger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { LocalizedContent } from '@shared/schema';

const logger = createLogger('companyCard');

// Use local placeholder image
const PLACEHOLDER_IMAGE = '/placeholder.svg';

interface CompanyCardProps {
  company: Company;
  onEdit: (id: string) => void;
  onDelete: (company: Company) => void;
}

export function CompanyCard({ company, onEdit, onDelete }: CompanyCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { i18n } = useTranslation();
  
  // Helper function to get localized content
  const getLocalizedContent = (content: string | LocalizedContent): string => {
    if (typeof content === 'string') return content;
    return content[i18n.language as keyof LocalizedContent] || content.en || '';
  };
  
  const handleEdit = () => {
    onEdit(company.id);
  };
  
  const handleDelete = () => {
    onDelete(company);
  };

  const handleImageError = () => {
    logger.warn(`Failed to load logo for company: ${getLocalizedContent(company.name)}`);
    setLogoError(true);
  };

  // Generate initials from company name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const companyInitials = getInitials(getLocalizedContent(company.name));

  // Get industries from either the industries array or the legacy industry field
  const displayIndustries = company.industries?.length 
    ? company.industries 
    : (company.industry ? [{ id: 'legacy', name: company.industry }] : []);

  return (
    <>
      <Card className="overflow-hidden border-2 hover:shadow-md transition-shadow duration-200">
        <div 
          className="aspect-video relative bg-gray-100 flex items-center justify-center border-b-2"
          style={{ borderColor: company.color || '#3b82f6' }}
        >
          {!logoError && company.logoUrl ? (
            <img
              src={company.logoUrl}
              alt={`${getLocalizedContent(company.name)} logo`}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full">
              {companyInitials ? (
                <div 
                  className="flex items-center justify-center w-16 h-16 rounded-full"
                  style={{ 
                    backgroundColor: `${company.color || '#3b82f6'}20`,
                    color: company.color || '#3b82f6'
                  }}
                >
                  <span className="text-2xl font-bold">
                    {companyInitials}
                  </span>
                </div>
              ) : (
                <Building className="w-12 h-12 text-gray-400" />
              )}
            </div>
          )}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/80 hover:bg-white">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg truncate">{getLocalizedContent(company.name)}</h3>
            <div className="flex flex-wrap gap-1">
              {displayIndustries.length > 0 ? (
                displayIndustries.map((industry, idx) => (
                  <Badge 
                    key={industry.id || idx}
                    variant="secondary" 
                    className="flex items-center gap-1 text-xs"
                  >
                    <Tag className="h-3 w-3" />
                    {getLocalizedContent(industry.name)}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">No industry specified</span>
              )}
            </div>
            {company.city && company.country && (
              <p className="text-sm text-gray-500 truncate mt-1">
                {getLocalizedContent(company.city)}, {getLocalizedContent(company.country)}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowDetails(true)}
          >
            View Details
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{getLocalizedContent(company.name)}</DialogTitle>
            <DialogDescription>
              Company details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="flex items-center gap-4">
              <div 
                className="h-24 w-24 rounded-md border-2 flex items-center justify-center overflow-hidden bg-gray-50"
                style={{ borderColor: company.color || '#3b82f6' }}
              >
                {!logoError && company.logoUrl ? (
                  <img 
                    src={company.logoUrl} 
                    alt={`${getLocalizedContent(company.name)} logo`} 
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    {companyInitials ? (
                      <div 
                        className="flex items-center justify-center w-16 h-16 rounded-full"
                        style={{ 
                          backgroundColor: `${company.color || '#3b82f6'}20`,
                          color: company.color || '#3b82f6'
                        }}
                      >
                        <span className="text-2xl font-bold">
                          {companyInitials}
                        </span>
                      </div>
                    ) : (
                      <Building className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{getLocalizedContent(company.name)}</h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {displayIndustries.length > 0 ? (
                    displayIndustries.map((industry, idx) => (
                      <Badge 
                        key={industry.id || idx}
                        variant="secondary" 
                        className="flex items-center gap-1 text-xs"
                      >
                        <Tag className="h-3 w-3" />
                        {getLocalizedContent(industry.name)}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No industry specified</span>
                  )}
                </div>
              </div>
            </div>
            
            {company.description && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Description</h4>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border">
                  {getLocalizedContent(company.description)}
                </p>
              </div>
            )}
            
            <div>
              <h4 className="text-sm font-medium mb-2">Contact Information</h4>
              <div className="bg-gray-50 rounded-md border p-3 space-y-2">
                {(company.city || company.country) && (
                  <div className="flex items-start">
                    <span className="text-sm font-medium w-20">Location:</span>
                    <span className="text-sm text-gray-700">
                      {company.city && company.country 
                        ? `${getLocalizedContent(company.city)}, ${getLocalizedContent(company.country)}` 
                        : getLocalizedContent(company.city) || getLocalizedContent(company.country) || "Not specified"}
                    </span>
                  </div>
                )}
                
                {company.email && (
                  <div className="flex items-start">
                    <span className="text-sm font-medium w-20">Email:</span>
                    <a 
                      href={`mailto:${company.email}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {company.email}
                    </a>
                  </div>
                )}
                
                {company.phone && (
                  <div className="flex items-start">
                    <span className="text-sm font-medium w-20">Phone:</span>
                    <a 
                      href={`tel:${company.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {company.phone}
                    </a>
                  </div>
                )}
                
                {!company.email && !company.phone && !getLocalizedContent(company.city) && !getLocalizedContent(company.country) && (
                  <p className="text-sm text-gray-500">No contact information available</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowDetails(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 