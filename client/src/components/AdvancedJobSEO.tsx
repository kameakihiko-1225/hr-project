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

      // Enhanced multilingual keywords based on actual data and comprehensive search terms
      const jobKeywords = [
        ...jobTitles,
        ...companyNames,
        ...departmentNames,
        // Comprehensive Central Asian job search terms by language
        currentLanguage === 'ru' ? 'Работа в Ташкенте, Вакансии в Узбекистане, Карьера в Ташкенте, Удаленная работа Узбекистан, Работа для англоговорящих Ташкент, Переводчик Ташкент, Работа в международных организациях Узбекистан, Консультационные услуги Ташкент, Стажировка в Ташкенте, Работа в IT Ташкент, Образование вакансии Узбекистан, Финансовые вакансии Ташкент, Сельское хозяйство работа Узбекистан, Горнодобывающая промышленность Узбекистан, Работа в Самарканде, Вакансии Бухара, Работа в Каракалпакстане' :
        currentLanguage === 'uz' ? 'Toshkentda ish, O\'zbekistonda ish o\'rinlari, Karyera Toshkent, Masofaviy ish O\'zbekiston, Ingliz tilida ish Toshkent, Tarjimon Toshkent, Xalqaro tashkilotlarda ish O\'zbekiston, Konsultatsiya xizmatlari Toshkent, Toshkentda stajirovka, IT sohasida ish Tashkent, Ta\'lim sohasida ish O\'zbekiston, Moliya sohasida ish Tashkent, Qishloq xo\'jaligi ishi O\'zbekiston, Konchilik sohasi O\'zbekiston, Samarqandda ish, Buxoroda ish o\'rinlari, Qoraqalpog\'istonda ish' :
        'jobs in Tashkent, jobs in Uzbekistan, careers in Tashkent, Tashkent job vacancies, Uzbekistan employment opportunities, remote jobs Uzbekistan, work in Tashkent, Tashkent career opportunities, Uzbekistan job market, freelance jobs Uzbekistan, Tashkent internship opportunities, English-speaking jobs Tashkent, international jobs Uzbekistan, consulting jobs Tashkent, NGO jobs Uzbekistan, translation jobs Uzbekistan, tech jobs Tashkent, education jobs Uzbekistan, finance jobs Tashkent, agriculture jobs Uzbekistan, mining jobs Uzbekistan, government jobs Uzbekistan, graphic design jobs Tashkent, Tashkent employment, Uzbekistan career growth, jobs in Samarkand, Bukhara job opportunities, Karakalpakstan jobs'
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

      // Language-specific OpenGraph updates with comprehensive keywords
      const languageSpecificTitles = {
        en: `${positions.length} Jobs in Tashkent & Uzbekistan | Remote Jobs | Tech Jobs | English-speaking Jobs | Millat Umidi Career Portal`,
        ru: `${positions.length} вакансий в Ташкенте и Узбекистане | Удаленная работа | IT вакансии | Работа для англоговорящих | Портал карьеры Millat Umidi`,
        uz: `Toshkent va O'zbekistonda ${positions.length} ta ish | Masofaviy ish | IT sohasida ish | Ingliz tilida ish | Millat Umidi karyera portali`
      };

      const languageSpecificDescriptions = {
        en: `Find ${positions.length} jobs in Tashkent, remote jobs Uzbekistan, English-speaking positions, tech jobs, consulting opportunities, NGO jobs, translation work. Education jobs, finance careers, government positions across Tashkent, Samarkand, Bukhara, Karakalpakstan.`,
        ru: `Найдите ${positions.length} вакансий в Ташкенте, удаленную работу в Узбекистане, работу для англоговорящих, IT вакансии, консультационные услуги, работу в НПО, переводческую работу. Образовательные вакансии, финансовые карьеры, государственные должности в Ташкенте, Самарканде, Бухаре, Каракалпакстане.`,
        uz: `${positions.length} ta Toshkentda ish, O'zbekistonda masofaviy ish, ingliz tilida ish, IT sohasida ish, konsultatsiya xizmatlari, tarjimon ishi toping. Ta'lim sohasida ish, moliya karyerasi, davlat lavozimlar Toshkent, Samarqand, Buxoro, Qoraqalpog'istonda.`
      };

      const ogTitleTag = document.querySelector('meta[property="og:title"]');
      if (ogTitleTag) {
        ogTitleTag.setAttribute('content', languageSpecificTitles[currentLanguage as keyof typeof languageSpecificTitles] || languageSpecificTitles.en);
      }

      const ogDescTag = document.querySelector('meta[property="og:description"]');
      if (ogDescTag) {
        ogDescTag.setAttribute('content', languageSpecificDescriptions[currentLanguage as keyof typeof languageSpecificDescriptions] || languageSpecificDescriptions.en);
      }

      // Update page title and meta description dynamically
      document.title = languageSpecificTitles[currentLanguage as keyof typeof languageSpecificTitles] || languageSpecificTitles.en;
      
      const metaDescTag = document.querySelector('meta[name="description"]');
      if (metaDescTag) {
        metaDescTag.setAttribute('content', languageSpecificDescriptions[currentLanguage as keyof typeof languageSpecificDescriptions] || languageSpecificDescriptions.en);
      }
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