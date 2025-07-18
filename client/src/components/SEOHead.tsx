import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  canonical?: string;
}

export const SEOHead = ({
  title,
  description,
  keywords,
  image = '/logo png.png',
  url,
  type = 'website',
  canonical
}: SEOHeadProps) => {
  const { i18n, t } = useTranslation();
  const [location] = useLocation();
  
  // Get current language and region
  const currentLanguage = i18n.language || 'en';
  const isRussian = currentLanguage === 'ru';
  const isUzbek = currentLanguage === 'uz';
  
  // SEO data by language for Central Asia
  const seoData = {
    en: {
      siteName: 'Millat Umidi - Career Opportunities in Central Asia',
      defaultTitle: 'Jobs in Uzbekistan | Millat Umidi Career Portal | Tashkent Employment',
      defaultDescription: 'Find top career opportunities in Uzbekistan with Millat Umidi. Leading HR platform connecting talent with employers in Tashkent, Samarkand, and across Central Asia. Apply now!',
      defaultKeywords: 'jobs Uzbekistan, careers Tashkent, employment Central Asia, Millat Umidi jobs, work in Uzbekistan, HR platform, job search Tashkent, career opportunities',
      locale: 'en_UZ',
      region: 'UZ'
    },
    ru: {
      siteName: 'Миллат Умиди - Карьерные возможности в Центральной Азии',
      defaultTitle: 'Работа в Узбекистане | Портал карьеры Миллат Умиди | Трудоустройство в Ташкенте',
      defaultDescription: 'Найдите лучшие карьерные возможности в Узбекистане с Миллат Умиди. Ведущая HR платформа, соединяющая таланты с работодателями в Ташкенте, Самарканде и по всей Центральной Азии.',
      defaultKeywords: 'работа Узбекистан, карьера Ташкент, трудоустройство Центральная Азия, вакансии Миллат Умиди, работа в Узбекистане, HR платформа, поиск работы Ташкент',
      locale: 'ru_UZ',
      region: 'UZ'
    },
    uz: {
      siteName: 'Millat Umidi - Markaziy Osiyoda karyera imkoniyatlari',
      defaultTitle: 'Oʻzbekistonda ish | Millat Umidi karyera portali | Toshkentda bandlik',
      defaultDescription: 'Millat Umidi bilan Oʻzbekistonda eng yaxshi karyera imkoniyatlarini toping. Toshkent, Samarqand va butun Markaziy Osiyoda iqtidorlarni ish beruvchilar bilan bogʻlovchi yetakchi HR platforma.',
      defaultKeywords: 'ish Oʻzbekiston, karyera Toshkent, bandlik Markaziy Osiya, Millat Umidi ish, Oʻzbekistonda ishlash, HR platforma, ish qidirish Toshkent, karyera imkoniyatlari',
      locale: 'uz_UZ',
      region: 'UZ'
    }
  };

  const currentSEO = seoData[currentLanguage as keyof typeof seoData] || seoData.en;
  
  // Build final SEO values
  const finalTitle = title ? `${title} | ${currentSEO.siteName}` : currentSEO.defaultTitle;
  const finalDescription = description || currentSEO.defaultDescription;
  const finalKeywords = keywords || currentSEO.defaultKeywords;
  const currentUrl = url || `${window.location.origin}${location}`;
  const canonicalUrl = canonical || currentUrl;
  const fullImageUrl = image.startsWith('http') ? image : `${window.location.origin}${image}`;

  useEffect(() => {
    // Update document title
    document.title = finalTitle;
    
    // Update meta tags
    const updateMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
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

    // Update link tags
    const updateLink = (rel: string, href: string, hreflang?: string) => {
      const selector = hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`;
      let link = document.querySelector(selector) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.rel = rel;
        if (hreflang) link.hreflang = hreflang;
        document.head.appendChild(link);
      }
      link.href = href;
    };

    // Basic SEO meta tags
    updateMeta('description', finalDescription);
    updateMeta('keywords', finalKeywords);
    updateMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    updateMeta('author', 'Millat Umidi Group');
    updateMeta('viewport', 'width=device-width, initial-scale=1, maximum-scale=5');

    // Language and region meta tags
    updateMeta('language', currentLanguage);
    updateMeta('geo.region', currentSEO.region);
    updateMeta('geo.country', 'UZ');
    updateMeta('geo.placename', 'Tashkent, Uzbekistan');

    // Open Graph meta tags
    updateMeta('og:title', finalTitle, true);
    updateMeta('og:description', finalDescription, true);
    updateMeta('og:image', fullImageUrl, true);
    updateMeta('og:url', currentUrl, true);
    updateMeta('og:type', type, true);
    updateMeta('og:site_name', currentSEO.siteName, true);
    updateMeta('og:locale', currentSEO.locale, true);

    // Twitter Card meta tags
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:title', finalTitle);
    updateMeta('twitter:description', finalDescription);
    updateMeta('twitter:image', fullImageUrl);

    // Canonical URL
    updateLink('canonical', canonicalUrl);

    // Hreflang tags for multilingual support
    const baseUrl = window.location.origin;
    const pathWithoutLang = location.replace(/^\/(en|ru|uz)/, '') || '/';
    
    // Add hreflang for each language
    updateLink('alternate', `${baseUrl}${pathWithoutLang}`, 'en');
    updateLink('alternate', `${baseUrl}/ru${pathWithoutLang}`, 'ru-UZ');
    updateLink('alternate', `${baseUrl}/uz${pathWithoutLang}`, 'uz-UZ');
    updateLink('alternate', `${baseUrl}${pathWithoutLang}`, 'x-default');

    // Additional Central Asia specific tags
    updateMeta('DC.title', finalTitle);
    updateMeta('DC.description', finalDescription);
    updateMeta('DC.subject', finalKeywords);
    updateMeta('DC.language', currentLanguage);
    updateMeta('DC.coverage', 'Uzbekistan, Central Asia, Tashkent');

    // Schema.org JSON-LD structured data
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": currentSEO.siteName,
      "url": baseUrl,
      "description": finalDescription,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${baseUrl}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Millat Umidi Group",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/logo png.png`
        }
      },
      "inLanguage": currentLanguage,
      "audience": {
        "@type": "Audience",
        "geographicArea": {
          "@type": "Country",
          "name": "Uzbekistan"
        }
      }
    };

    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

  }, [finalTitle, finalDescription, finalKeywords, currentUrl, canonicalUrl, fullImageUrl, type, currentLanguage, location, currentSEO]);

  return null; // This component only handles head updates
};

export default SEOHead;