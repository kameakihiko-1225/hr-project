import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';

interface AdvancedJobSEOProps {
  positions?: any[];
  companies?: any[];
  departments?: any[];
}

export const AdvancedJobSEO = ({ positions = [], companies = [], departments = [] }: AdvancedJobSEOProps) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || 'en';

  useEffect(() => {
    // Advanced job-specific meta tags for Central Asian search optimization
    const updateJobMetaTags = () => {
      // Create comprehensive job keywords from actual data
      const jobTitles = positions.map(pos => {
        if (typeof pos.title === 'object') {
          return pos.title[currentLanguage] || pos.title.en || '';
        }
        return pos.title || '';
      }).filter(Boolean);

      const companyNames = companies.map(comp => {
        if (typeof comp.name === 'object') {
          return comp.name[currentLanguage] || comp.name.en || '';
        }
        return comp.name || '';
      }).filter(Boolean);

      const departmentNames = departments.map(dept => {
        if (typeof dept.name === 'object') {
          return dept.name[currentLanguage] || dept.name.en || '';
        }
        return dept.name || '';
      }).filter(Boolean);

      // Enhanced multilingual keywords based on actual data
      const jobKeywords = [
        ...jobTitles,
        ...companyNames,
        ...departmentNames,
        // Central Asian job search terms
        currentLanguage === 'ru' ? 'работа Узбекистан, карьера Ташкент, вакансии, трудоустройство Центральная Азия, поиск работы, сотрудник, педагог, учитель, менеджер, финансы, IT, информационные технологии, HR, кадры, маркетинг, продажи, администратор, бухгалтерия, юридический, медицина, образование' :
        currentLanguage === 'uz' ? 'ish Oʻzbekiston, karyera Toshkent, vakansiya, bandlik Markaziy Osiya, ish qidirish, ish beruvchi, pedagog, oʻqituvchi, menejеr, moliya, IT, axborot texnologiyalari, HR, kadirlar, marketing, savdo, admin, buxgalteriya, yuridik, tibbiyot, taʻlim' :
        'jobs Uzbekistan, careers Tashkent, employment Central Asia, work opportunities, job search, employee, teacher, manager, finance, IT, information technology, HR, human resources, marketing, sales, administration, accounting, legal, medical, education'
      ].join(', ');

      // Update meta keywords with actual job data
      const keywordsMetaTag = document.querySelector('meta[name="keywords"]');
      if (keywordsMetaTag) {
        keywordsMetaTag.setAttribute('content', jobKeywords);
      }

      // Enhanced job-specific structured data
      if (positions.length > 0) {
        const jobListingSchema = {
          "@context": "https://schema.org",
          "@type": "JobBoard",
          "name": "Millat Umidi Career Portal - Central Asia Jobs",
          "url": "https://career.millatumidi.uz",
          "description": `Find ${positions.length} job opportunities in Central Asia including ${jobTitles.slice(0, 3).join(', ')} positions`,
          "numberOfJobs": positions.length,
          "jobLocation": [
            {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Tashkent",
                "addressCountry": "UZ"
              }
            },
            {
              "@type": "Place", 
              "address": {
                "@type": "PostalAddress",
                "addressLocality": "Samarkand",
                "addressCountry": "UZ"
              }
            }
          ],
          "hiringOrganization": companies.map(company => ({
            "@type": "Organization",
            "name": typeof company.name === 'object' ? company.name[currentLanguage] || company.name.en : company.name,
            "logo": company.logoUrl ? `https://career.millatumidi.uz${company.logoUrl}` : "https://career.millatumidi.uz/logo png.png"
          })),
          "occupationalCategory": departmentNames,
          "inLanguage": [currentLanguage, "en", "ru", "uz"],
          "datePosted": new Date().toISOString(),
          "validThrough": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        };

        // Inject or update job listing schema
        let jobSchemaScript = document.querySelector('script[data-job-schema]');
        if (!jobSchemaScript) {
          jobSchemaScript = document.createElement('script');
          jobSchemaScript.type = 'application/ld+json';
          jobSchemaScript.setAttribute('data-job-schema', 'true');
          document.head.appendChild(jobSchemaScript);
        }
        jobSchemaScript.textContent = JSON.stringify(jobListingSchema);
      }

      // Language-specific OpenGraph updates
      const languageSpecificTitles = {
        en: `${positions.length} Jobs in Uzbekistan | Millat Umidi Career Portal | Tashkent Employment`,
        ru: `${positions.length} вакансий в Узбекистане | Портал карьеры Millat Umidi | Работа в Ташкенте`,
        uz: `Oʻzbekistonda ${positions.length} ta ish | Millat Umidi karyera portali | Toshkentda bandlik`
      };

      const ogTitleTag = document.querySelector('meta[property="og:title"]');
      if (ogTitleTag) {
        ogTitleTag.setAttribute('content', languageSpecificTitles[currentLanguage as keyof typeof languageSpecificTitles] || languageSpecificTitles.en);
      }

      // Update page title dynamically
      document.title = languageSpecificTitles[currentLanguage as keyof typeof languageSpecificTitles] || languageSpecificTitles.en;
    };

    // Update meta tags when data changes
    if (positions.length > 0 || companies.length > 0) {
      updateJobMetaTags();
    }
  }, [positions, companies, departments, currentLanguage]);

  // Voice search optimization meta tags
  useEffect(() => {
    const voiceSearchSchema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://career.millatumidi.uz/search?q={search_term_string}",
          "actionPlatform": [
            "http://schema.org/DesktopWebPlatform",
            "http://schema.org/IOSPlatform", 
            "http://schema.org/AndroidPlatform"
          ]
        },
        "query-input": "required name=search_term_string"
      },
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [".position-card", ".hero-section", ".stats-section"]
      }
    };

    let voiceSchemaScript = document.querySelector('script[data-voice-schema]');
    if (!voiceSchemaScript) {
      voiceSchemaScript = document.createElement('script');
      voiceSchemaScript.type = 'application/ld+json';
      voiceSchemaScript.setAttribute('data-voice-schema', 'true');
      document.head.appendChild(voiceSchemaScript);
    }
    voiceSchemaScript.textContent = JSON.stringify(voiceSearchSchema);

    // Add preconnect for faster external resource loading
    const preconnectLinks = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://api.telegram.org'
    ];

    preconnectLinks.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }, []);

  return null; // This component only manages SEO meta tags
};

export default AdvancedJobSEO;