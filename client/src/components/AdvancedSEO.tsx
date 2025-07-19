import { useEffect } from 'react';

interface AdvancedSEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  structuredData?: object;
}

export const AdvancedSEO: React.FC<AdvancedSEOProps> = ({
  title = "Millat Umidi HR - Top Jobs in Central Asia | Kazakhstan Uzbekistan Kyrgyzstan",
  description = "Find premium career opportunities at Millat Umidi Group. Leading educational and corporate positions in Central Asia. Join our growing team in Kazakhstan, Uzbekistan, and Kyrgyzstan.",
  keywords = "millat umidi jobs, central asia careers, uzbekistan jobs, kazakhstan employment, kyrgyzstan vacancies, hr positions, educational jobs, corporate careers, tashkent jobs, almaty careers",
  canonicalUrl,
  ogImage = "https://career.millatumidi.uz/logo%20png.png",
  structuredData
}) => {
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property?: string) => {
      let meta = document.querySelector(`meta[${property ? 'property' : 'name'}="${name}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    // Basic SEO meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);
    updateMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    updateMetaTag('author', 'Millat Umidi Group');
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Open Graph meta tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:image', ogImage, true);
    updateMetaTag('og:site_name', 'Millat Umidi HR', true);
    updateMetaTag('og:locale', 'en_US', true);
    updateMetaTag('og:locale:alternate', 'ru_RU', true);
    updateMetaTag('og:locale:alternate', 'uz_UZ', true);
    
    // Twitter Card meta tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);
    
    // Additional SEO meta tags for better ranking
    updateMetaTag('theme-color', '#b69b83');
    updateMetaTag('msapplication-TileColor', '#b69b83');
    updateMetaTag('application-name', 'Millat Umidi HR');
    
    // Canonical URL
    if (canonicalUrl) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.rel = 'canonical';
        document.head.appendChild(canonical);
      }
      canonical.href = canonicalUrl;
    }
    
    // Structured data (JSON-LD)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }
    
    // Add hreflang links for multilingual SEO
    const addHreflangLink = (lang: string, href: string) => {
      let link = document.querySelector(`link[hreflang="${lang}"]`) as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'alternate';
        link.hreflang = lang;
        document.head.appendChild(link);
      }
      link.href = href;
    };
    
    const currentPath = window.location.pathname;
    const baseUrl = 'https://career.millatumidi.uz';
    
    addHreflangLink('en', `${baseUrl}${currentPath}?lang=en`);
    addHreflangLink('ru', `${baseUrl}${currentPath}?lang=ru`);
    addHreflangLink('uz', `${baseUrl}${currentPath}?lang=uz`);
    addHreflangLink('x-default', `${baseUrl}${currentPath}`);
    
  }, [title, description, keywords, canonicalUrl, ogImage, structuredData]);

  return null;
};

// Default structured data for the homepage
export const getHomepageStructuredData = () => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://career.millatumidi.uz/#organization",
      "name": "Millat Umidi Group",
      "alternateName": "Millat Umidi HR",
      "url": "https://career.millatumidi.uz",
      "logo": {
        "@type": "ImageObject",
        "url": "https://career.millatumidi.uz/logo%20png.png",
        "width": 300,
        "height": 100
      },
      "description": "Leading educational and corporate organization in Central Asia providing premium career opportunities",
      "foundingDate": "2015",
      "areaServed": [
        {
          "@type": "Country",
          "name": "Uzbekistan"
        },
        {
          "@type": "Country", 
          "name": "Kazakhstan"
        },
        {
          "@type": "Country",
          "name": "Kyrgyzstan"
        }
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+998-71-123-4567",
        "contactType": "Customer Service",
        "availableLanguage": ["English", "Russian", "Uzbek"]
      },
      "sameAs": [
        "https://t.me/millatumidi",
        "https://linkedin.com/company/millat-umidi"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://career.millatumidi.uz/#website",
      "url": "https://career.millatumidi.uz",
      "name": "Millat Umidi HR - Premium Careers in Central Asia",
      "description": "Find top career opportunities in education and corporate sectors across Central Asia",
      "publisher": {
        "@id": "https://career.millatumidi.uz/#organization"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://career.millatumidi.uz/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      },
      "inLanguage": ["en", "ru", "uz"]
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://career.millatumidi.uz/#breadcrumb",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://career.millatumidi.uz"
        }
      ]
    }
  ]
});

// Structured data for job positions
export const getJobStructuredData = (position: any) => ({
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": position.title,
  "description": position.description,
  "identifier": {
    "@type": "PropertyValue",
    "name": "Millat Umidi",
    "value": position.id
  },
  "datePosted": position.createdAt,
  "employmentType": position.employmentType?.toUpperCase() || "FULL_TIME",
  "hiringOrganization": {
    "@type": "Organization",
    "name": "Millat Umidi Group",
    "sameAs": "https://career.millatumidi.uz",
    "logo": "https://career.millatumidi.uz/logo%20png.png"
  },
  "jobLocation": {
    "@type": "Place",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": position.city || "Tashkent",
      "addressCountry": position.country || "UZ"
    }
  },
  "baseSalary": position.salaryRange ? {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": {
      "@type": "QuantitativeValue",
      "value": position.salaryRange
    }
  } : undefined,
  "qualifications": position.qualifications,
  "responsibilities": position.responsibilities,
  "skills": position.languageRequirements
});