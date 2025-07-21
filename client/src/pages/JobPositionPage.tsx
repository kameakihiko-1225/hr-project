import React, { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  Clock, 
  Users, 
  Mail,
  Phone,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { getPositionById, getCompanyById, getDepartmentById } from '@/lib/api';

interface JobPositionPageProps {}

const JobPositionPage: React.FC<JobPositionPageProps> = () => {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { t, i18n } = useTranslation();
  
  const positionId = id ? parseInt(id) : null;

  const { data: position, isLoading: positionLoading, error: positionError } = useQuery({
    queryKey: ['/api/positions', positionId],
    queryFn: () => getPositionById(positionId!),
    enabled: !!positionId,
  });

  const { data: department } = useQuery({
    queryKey: ['/api/departments', position?.departmentId],
    queryFn: () => getDepartmentById(position!.departmentId!),
    enabled: !!position?.departmentId,
  });

  const { data: company } = useQuery({
    queryKey: ['/api/companies', department?.companyId],
    queryFn: () => getCompanyById(department!.companyId!),
    enabled: !!department?.companyId,
  });

  // Helper function to get localized content
  const getLocalizedContent = (content: any): string => {
    if (typeof content === 'string') return content;
    if (!content) return '';
    
    const lang = i18n.language;
    return content[lang] || content.en || content.ru || content.uz || '';
  };

  // SEO and structured data setup
  useEffect(() => {
    if (position && company) {
      // Update page title
      const positionTitle = getLocalizedContent(position.title);
      const companyName = getLocalizedContent(company.name);
      document.title = `${positionTitle} at ${companyName} | Millat Umidi Career Portal`;

      // Update meta description
      const description = getLocalizedContent(position.description);
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', 
          `${positionTitle} position at ${companyName} in ${position.city}. ${description.substring(0, 120)}...`
        );
      }

      // Add JobPosting structured data
      const jobPostingSchema = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": positionTitle,
        "description": description,
        "identifier": {
          "@type": "PropertyValue",
          "name": "Position ID",
          "value": position.id.toString()
        },
        "datePosted": position.createdAt,
        "validThrough": position.expectedStartDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        "employmentType": position.employmentType === "Full-time" ? "FULL_TIME" : position.employmentType === "Part-time" ? "PART_TIME" : "CONTRACTOR",
        "hiringOrganization": {
          "@type": "Organization",
          "name": companyName,
          "sameAs": "https://career.millatumidi.uz",
          "logo": company.logoUrl ? `https://career.millatumidi.uz${company.logoUrl}` : "https://career.millatumidi.uz/logo png.png",
          "url": "https://career.millatumidi.uz"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": position.city || company.city || "Tashkent",
            "addressCountry": position.country || company.country || "UZ",
            "addressRegion": "Tashkent Region"
          }
        },
        "baseSalary": position.salaryRange ? {
          "@type": "MonetaryAmount",
          "currency": "UZS",
          "value": {
            "@type": "QuantitativeValue",
            "value": getLocalizedContent(position.salaryRange)
          }
        } : undefined,
        "qualifications": getLocalizedContent(position.qualifications) || "As specified in job description",
        "responsibilities": getLocalizedContent(position.responsibilities) || description,
        "skills": position.languageRequirements || "Professional communication skills",
        "workHours": position.employmentType,
        "industry": company.industries?.[0]?.name || "Education",
        "occupationalCategory": department ? getLocalizedContent(department.name) : "General",
        "applicationContact": {
          "@type": "ContactPoint",
          "contactType": "HR Department",
          "email": company.email || "careers@millatumidi.uz",
          "telephone": company.phone || "+998 71 123 4567"
        },
        "url": `https://career.millatumidi.uz/positions/${position.id}`,
        "jobBenefits": [
          "Professional development opportunities",
          "Competitive salary package", 
          "Modern work environment",
          "Career growth potential"
        ],
        "educationRequirements": getLocalizedContent(position.qualifications) || "Bachelor's degree or equivalent experience"
      };

      // Add structured data to page
      const existingScript = document.getElementById('job-posting-schema');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.id = 'job-posting-schema';
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jobPostingSchema);
      document.head.appendChild(script);
    }

    // Cleanup on unmount
    return () => {
      const script = document.getElementById('job-posting-schema');
      if (script) {
        script.remove();
      }
    };
  }, [position, company, department, i18n.language]);

  if (positionLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (positionError || !position) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-600 mb-4">
              {t('errors.positionNotFound', 'Position not found')}
            </h2>
            <Button onClick={() => setLocation('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('actions.backToHome', 'Back to Home')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleApplyClick = () => {
    const applyLink = getLocalizedContent(position.applyLink);
    if (applyLink) {
      // Track application click
      fetch(`/api/positions/${position.id}/track-click`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clickType: 'apply' })
      });
      
      window.open(applyLink, '_blank');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/')}
          className="p-0 h-auto text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('navigation.backToJobs', 'Back to Jobs')}
        </Button>
      </nav>

      {/* Job Header */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold mb-4">
                {getLocalizedContent(position.title)}
              </CardTitle>
              
              <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
                {company && (
                  <div className="flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    {getLocalizedContent(company.name)}
                  </div>
                )}
                
                {(position.city || company?.city) && (
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    {position.city || company?.city}, {position.country || company?.country || 'Uzbekistan'}
                  </div>
                )}

                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  {position.employmentType}
                </div>

                {position.salaryRange && (
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    {getLocalizedContent(position.salaryRange)}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {department && (
                  <Badge variant="secondary">
                    {getLocalizedContent(department.name)}
                  </Badge>
                )}
                
                {company?.industries?.map((industry) => (
                  <Badge key={industry.id} variant="outline">
                    {industry.name}
                  </Badge>
                ))}
              </div>
            </div>

            {company?.logoUrl && (
              <div className="ml-6">
                <img 
                  src={company.logoUrl} 
                  alt={`${getLocalizedContent(company.name)} logo`}
                  className="w-20 h-20 object-contain rounded-lg border"
                />
              </div>
            )}
          </div>

          <Button 
            onClick={handleApplyClick}
            size="lg"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
            disabled={!getLocalizedContent(position.applyLink)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            {t('actions.applyNow', 'Apply Now')}
          </Button>
        </CardHeader>
      </Card>

      {/* Job Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>{t('jobDetails.description', 'Job Description')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {getLocalizedContent(position.description)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Responsibilities */}
          {position.responsibilities && (
            <Card>
              <CardHeader>
                <CardTitle>{t('jobDetails.responsibilities', 'Responsibilities')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {getLocalizedContent(position.responsibilities)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Qualifications */}
          {position.qualifications && (
            <Card>
              <CardHeader>
                <CardTitle>{t('jobDetails.qualifications', 'Qualifications')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {getLocalizedContent(position.qualifications)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Language Requirements */}
          {position.languageRequirements && (
            <Card>
              <CardHeader>
                <CardTitle>{t('jobDetails.languageRequirements', 'Language Requirements')}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{position.languageRequirements}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Info */}
          {company && (
            <Card>
              <CardHeader>
                <CardTitle>{t('company.aboutCompany', 'About Company')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  {company.logoUrl && (
                    <img 
                      src={company.logoUrl} 
                      alt={`${getLocalizedContent(company.name)} logo`}
                      className="w-12 h-12 object-contain rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-semibold">{getLocalizedContent(company.name)}</h3>
                    {company.industries?.[0] && (
                      <p className="text-sm text-gray-600">{company.industries[0].name}</p>
                    )}
                  </div>
                </div>

                {company.description && (
                  <>
                    <Separator />
                    <p className="text-sm text-gray-700">
                      {getLocalizedContent(company.description)}
                    </p>
                  </>
                )}

                <Separator />
                
                <div className="space-y-2 text-sm">
                  {company.address && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                      {company.address}
                    </div>
                  )}
                  
                  {company.email && (
                    <div className="flex items-center text-gray-600">
                      <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                      <a href={`mailto:${company.email}`} className="hover:text-blue-600">
                        {company.email}
                      </a>
                    </div>
                  )}
                  
                  {company.phone && (
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                      <a href={`tel:${company.phone}`} className="hover:text-blue-600">
                        {company.phone}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Job Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('jobDetails.details', 'Job Details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('jobDetails.employmentType', 'Employment Type')}:</span>
                <span className="font-medium">{position.employmentType}</span>
              </div>
              
              {position.expectedStartDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('jobDetails.startDate', 'Start Date')}:</span>
                  <span className="font-medium">
                    {new Date(position.expectedStartDate).toLocaleDateString(i18n.language)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-600">{t('jobDetails.posted', 'Posted')}:</span>
                <span className="font-medium">
                  {new Date(position.createdAt).toLocaleDateString(i18n.language)}
                </span>
              </div>

              {department && (
                <div className="flex justify-between">
                  <span className="text-gray-600">{t('jobDetails.department', 'Department')}:</span>
                  <span className="font-medium">{getLocalizedContent(department.name)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Apply Button */}
          <Card>
            <CardContent className="pt-6">
              <Button 
                onClick={handleApplyClick}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!getLocalizedContent(position.applyLink)}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                {t('actions.applyNow', 'Apply Now')}
              </Button>
              
              <p className="text-xs text-gray-500 mt-3 text-center">
                {t('jobDetails.applyExternal', 'You will be redirected to the application form')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobPositionPage;