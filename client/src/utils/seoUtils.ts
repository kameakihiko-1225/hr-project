export interface SEOPageData {
  title: string;
  description: string;
  keywords: string;
  canonical?: string;
}

// SEO data for different pages and languages
export const seoData = {
  en: {
    home: {
      title: 'Jobs in Uzbekistan | Millat Umidi Career Portal | Tashkent Employment',
      description: 'Find top career opportunities in Uzbekistan with Millat Umidi. Leading HR platform connecting talent with employers in Tashkent, Samarkand, and across Central Asia. Apply now!',
      keywords: 'jobs Uzbekistan, careers Tashkent, employment Central Asia, Millat Umidi jobs, work in Uzbekistan, HR platform, job search Tashkent, career opportunities, remote work Uzbekistan'
    },
    blog: {
      title: 'Career Insights & HR News | Millat Umidi Blog | Job Market Uzbekistan',
      description: 'Stay updated with the latest career trends, HR insights, and job market news in Uzbekistan and Central Asia. Expert advice for professionals and employers.',
      keywords: 'HR blog Uzbekistan, career advice, job market trends, professional development, employment news Central Asia, workplace tips'
    },
    positions: {
      title: 'Browse All Jobs | Open Positions | Millat Umidi Career Portal',
      description: 'Explore all available job opportunities across different industries in Uzbekistan. Find your perfect match with top employers in Tashkent and Central Asia.',
      keywords: 'job listings Uzbekistan, open positions, career opportunities, employment listings, job vacancies Tashkent, work opportunities Central Asia'
    }
  },
  ru: {
    home: {
      title: 'Работа в Узбекистане | Портал карьеры Миллат Умиди | Трудоустройство в Ташкенте',
      description: 'Найдите лучшие карьерные возможности в Узбекистане с Миллат Умиди. Ведущая HR платформа, соединяющая таланты с работодателями в Ташкенте, Самарканде и по всей Центральной Азии.',
      keywords: 'работа Узбекистан, карьера Ташкент, трудоустройство Центральная Азия, вакансии Миллат Умиди, работа в Узбекистане, HR платформа, поиск работы Ташкент, карьерные возможности, удаленная работа'
    },
    blog: {
      title: 'Карьерные инсайты и HR новости | Блог Миллат Умиди | Рынок труда Узбекистан',
      description: 'Следите за последними карьерными трендами, HR инсайтами и новостями рынка труда в Узбекистане и Центральной Азии. Экспертные советы для профессионалов и работодателей.',
      keywords: 'HR блог Узбекистан, карьерные советы, тренды рынка труда, профессиональное развитие, новости трудоустройства Центральная Азия'
    },
    positions: {
      title: 'Все вакансии | Открытые позиции | Портал карьеры Миллат Умиди',
      description: 'Изучите все доступные возможности трудоустройства в различных отраслях Узбекистана. Найдите идеальное совпадение с ведущими работодателями в Ташкенте и Центральной Азии.',
      keywords: 'вакансии Узбекистан, открытые позиции, карьерные возможности, списки вакансий, работа Ташкент, возможности трудоустройства Центральная Азия'
    }
  },
  uz: {
    home: {
      title: 'Oʻzbekistonda ish | Millat Umidi karyera portali | Toshkentda bandlik',
      description: 'Millat Umidi bilan Oʻzbekistonda eng yaxshi karyera imkoniyatlarini toping. Toshkent, Samarqand va butun Markaziy Osiyoda iqtidorlarni ish beruvchilar bilan bogʻlovchi yetakchi HR platforma.',
      keywords: 'ish Oʻzbekiston, karyera Toshkent, bandlik Markaziy Osiya, Millat Umidi ish, Oʻzbekistonda ishlash, HR platforma, ish qidirish Toshkent, karyera imkoniyatlari, masofaviy ish'
    },
    blog: {
      title: 'Karyera tushunchalari va HR yangiliklari | Millat Umidi blogi | Oʻzbekiston mehnat bozori',
      description: 'Oʻzbekiston va Markaziy Osiyodagi eng soʻnggi karyera tendensiyalari, HR tushunchalari va mehnat bozori yangiliklari bilan tanishib turing. Mutaxassislar va ish beruvchilar uchun ekspert maslahatlari.',
      keywords: 'HR blog Oʻzbekiston, karyera maslahatlari, mehnat bozori tendensiyalari, kasbiy rivojlanish, bandlik yangiliklari Markaziy Osiya'
    },
    positions: {
      title: 'Barcha ishlarni koʻrish | Ochiq lavozimlar | Millat Umidi karyera portali',
      description: 'Oʻzbekistonning turli sohalarida mavjud boʻlgan barcha ish imkoniyatlarini oʻrganing. Toshkent va Markaziy Osiyodagi yetakchi ish beruvchilar bilan mukammal moslikni toping.',
      keywords: 'ish eʼlonlari Oʻzbekiston, ochiq lavozimlar, karyera imkoniyatlari, ish roʻyxatlari, ish joyları Toshkent, Markaziy Osiyoda ish imkoniyatlari'
    }
  }
};

// Generate structured data for job postings
export const generateJobPostingSchema = (position: any, company: any, department: any) => {
  const baseUrl = window.location.origin;
  const currentLanguage = localStorage.getItem('i18nextLng') || 'en';
  
  const getLocalizedText = (obj: any) => {
    if (typeof obj === 'string') return obj;
    return obj?.[currentLanguage] || obj?.en || obj?.ru || obj?.uz || '';
  };

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    "title": getLocalizedText(position.title),
    "description": getLocalizedText(position.description),
    "identifier": {
      "@type": "PropertyValue",
      "name": "Millat Umidi Job ID",
      "value": position.id
    },
    "datePosted": position.createdAt,
    "validThrough": position.expectedStartDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    "employmentType": position.employmentType || "FULL_TIME",
    "hiringOrganization": {
      "@type": "Organization",
      "name": getLocalizedText(company.name),
      "sameAs": baseUrl,
      "logo": company.logoUrl ? `${baseUrl}${company.logoUrl}` : `${baseUrl}/logo png.png`
    },
    "jobLocation": {
      "@type": "Place",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": position.city || company.city || "Tashkent",
        "addressCountry": position.country || company.country || "UZ"
      }
    },
    "baseSalary": position.salaryRange ? {
      "@type": "MonetaryAmount",
      "currency": "UZS",
      "value": {
        "@type": "QuantitativeValue",
        "value": getLocalizedText(position.salaryRange)
      }
    } : undefined,
    "qualifications": getLocalizedText(position.qualifications) || "As specified in job description",
    "responsibilities": getLocalizedText(position.responsibilities) || getLocalizedText(position.description),
    "skills": position.languageRequirements || "As specified in job description",
    "workHours": position.employmentType === "Part-time" ? "Part-time" : "Full-time",
    "industry": company.industries?.[0]?.name || "Education",
    "occupationalCategory": getLocalizedText(department.name) || "General",
    "applicationContact": {
      "@type": "ContactPoint",
      "contactType": "HR Department",
      "email": company.email || "careers@millatumidi.uz",
      "telephone": company.phone || "+998 71 123 4567"
    }
  };
};

// Generate organization schema
export const generateOrganizationSchema = () => {
  const baseUrl = window.location.origin;
  
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": "Millat Umidi Group",
    "alternateName": "Миллат Умиди",
    "url": baseUrl,
    "logo": `${baseUrl}/logo png.png`,
    "description": "Leading educational institution and HR platform in Central Asia, connecting talent with opportunities across Uzbekistan, Kazakhstan, and neighboring countries.",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Tashkent",
      "addressLocality": "Tashkent",
      "addressCountry": "UZ"
    },
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "telephone": "+998 71 123 4567",
        "contactType": "customer service",
        "availableLanguage": ["English", "Russian", "Uzbek"]
      },
      {
        "@type": "ContactPoint",
        "email": "careers@millatumidi.uz",
        "contactType": "HR Department",
        "availableLanguage": ["English", "Russian", "Uzbek"]
      }
    ],
    "sameAs": [
      "https://t.me/millatumidi",
      "https://linkedin.com/company/millat-umidi"
    ],
    "founder": {
      "@type": "Person",
      "name": "Umidjon Kholmirzaev"
    },
    "areaServed": {
      "@type": "Country",
      "name": "Uzbekistan"
    },
    "knowsAbout": [
      "Higher Education",
      "Human Resources",
      "Career Development",
      "Professional Training",
      "Employment Services"
    ],
    "serviceArea": {
      "@type": "AdministrativeArea",
      "name": "Central Asia"
    }
  };
};

// Get page-specific SEO data
export const getPageSEO = (page: string, language: string = 'en'): SEOPageData => {
  const langData = seoData[language as keyof typeof seoData] || seoData.en;
  const pageData = langData[page as keyof typeof langData] || langData.home;
  
  return {
    title: pageData.title,
    description: pageData.description,
    keywords: pageData.keywords,
    canonical: `${window.location.origin}${language === 'en' ? '' : `/${language}`}${page === 'home' ? '' : `/${page}`}`
  };
};

// Generate sitemap data
export const generateSitemapData = () => {
  const baseUrl = window.location.origin;
  const languages = ['en', 'ru', 'uz'];
  const pages = [
    { path: '', priority: 1.0, changefreq: 'daily' },
    { path: '/blog', priority: 0.8, changefreq: 'weekly' }
  ];

  const urls: any[] = [];

  languages.forEach(lang => {
    pages.forEach(page => {
      const url = lang === 'en' 
        ? `${baseUrl}${page.path}`
        : `${baseUrl}/${lang}${page.path}`;
        
      urls.push({
        url,
        lastmod: new Date().toISOString(),
        priority: page.priority,
        changefreq: page.changefreq,
        alternates: languages.map(altLang => ({
          hreflang: altLang === 'en' ? 'en' : `${altLang}-UZ`,
          href: altLang === 'en' 
            ? `${baseUrl}${page.path}`
            : `${baseUrl}/${altLang}${page.path}`
        }))
      });
    });
  });

  return urls;
};