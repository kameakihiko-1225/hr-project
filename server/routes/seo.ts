import { Router } from 'express';
import { IStorage } from '../storage';

const router = Router();

export function createSEORoutes(storage: IStorage) {
  
  // Generate dynamic sitemap.xml
  router.get('/sitemap.xml', async (req, res) => {
    try {
      const positions = await storage.getAllPositions();
      const companies = await storage.getAllCompanies();
      const departments = await storage.getAllDepartments();
      const blogItems = await storage.getAllGalleryItems();
      
      const languages = ['en', 'ru', 'uz'];
      const baseUrl = 'https://career.millatumidi.uz';
      const currentDate = new Date().toISOString().split('T')[0];
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" 
        xmlns:xhtml="http://www.w3.org/1999/xhtml">`;

      // Homepage URLs
      languages.forEach(lang => {
        const url = lang === 'en' ? baseUrl : `${baseUrl}/${lang}`;
        const hreflangs = languages.map(l => {
          const href = l === 'en' ? baseUrl : `${baseUrl}/${l}`;
          const hreflang = l === 'en' ? 'en' : `${l}-UZ`;
          return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}/" />`;
        }).join('\n');
        
        sitemap += `
  <url>
    <loc>${url}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/" />
  </url>`;
      });

      // Blog URLs
      languages.forEach(lang => {
        const url = lang === 'en' ? `${baseUrl}/blog` : `${baseUrl}/${lang}/blog`;
        const hreflangs = languages.map(l => {
          const href = l === 'en' ? `${baseUrl}/blog` : `${baseUrl}/${l}/blog`;
          const hreflang = l === 'en' ? 'en' : `${l}-UZ`;
          return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}" />`;
        }).join('\n');
        
        sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${hreflangs}
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/blog" />
  </url>`;
      });

      // Individual job position URLs with structured data
      for (const position of positions) {
        languages.forEach(lang => {
          const url = lang === 'en' 
            ? `${baseUrl}/positions/${position.id}` 
            : `${baseUrl}/${lang}/positions/${position.id}`;
          
          sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        });
      }

      sitemap += `
</urlset>`;

      res.setHeader('Content-Type', 'application/xml');
      res.send(sitemap);
    } catch (error) {
      console.error('[SEO] Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Generate structured data for job positions
  router.get('/api/structured-data/position/:id', async (req, res) => {
    try {
      const positionId = parseInt(req.params.id);
      const language = req.query.language as string || 'en';
      
      const position = await storage.getPositionById(positionId);
      if (!position) {
        return res.status(404).json({ error: 'Position not found' });
      }

      // Get related company and department data
      const department = position.departmentId 
        ? await storage.getDepartmentById(position.departmentId)
        : null;
      
      const company = department?.companyId 
        ? await storage.getCompanyById(department.companyId)
        : null;

      const getLocalizedText = (obj: any) => {
        if (typeof obj === 'string') return obj;
        return obj?.[language] || obj?.en || obj?.ru || obj?.uz || '';
      };

      const baseUrl = 'https://career.millatumidi.uz';
      
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": getLocalizedText(position.title),
        "description": getLocalizedText(position.description),
        "identifier": {
          "@type": "PropertyValue",
          "name": "Millat Umidi Job ID",
          "value": position.id.toString()
        },
        "datePosted": position.createdAt,
        "validThrough": position.expectedStartDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        "employmentType": position.employmentType === "Full-time" ? "FULL_TIME" : "PART_TIME",
        "hiringOrganization": {
          "@type": "Organization",
          "name": company ? getLocalizedText(company.name) : "Millat Umidi Group",
          "sameAs": baseUrl,
          "logo": company?.logoUrl ? `${baseUrl}${company.logoUrl}` : `${baseUrl}/logo png.png`,
          "url": baseUrl
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": position.city || company?.city || "Tashkent",
            "addressCountry": position.country || company?.country || "UZ",
            "addressRegion": "Tashkent Region"
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
        "skills": position.languageRequirements || "Professional communication skills",
        "workHours": position.employmentType === "Part-time" ? "Part-time schedule" : "Full-time schedule",
        "industry": company?.industries?.[0]?.name || "Education",
        "occupationalCategory": department ? getLocalizedText(department.name) : "General",
        "applicationContact": {
          "@type": "ContactPoint",
          "contactType": "HR Department",
          "email": company?.email || "careers@millatumidi.uz",
          "telephone": company?.phone || "+998 71 123 4567"
        },
        "url": `${baseUrl}/positions/${position.id}`,
        "jobBenefits": [
          "Professional development opportunities",
          "Competitive salary package",
          "Modern work environment",
          "Career growth potential"
        ],
        "educationRequirements": getLocalizedText(position.qualifications) || "Bachelor's degree or equivalent experience"
      };

      res.json(structuredData);
    } catch (error) {
      console.error('[SEO] Error generating structured data:', error);
      res.status(500).json({ error: 'Error generating structured data' });
    }
  });

  // Meta tags API for dynamic pages
  router.get('/api/meta/:page', async (req, res) => {
    try {
      const page = req.params.page;
      const language = req.query.language as string || 'en';
      const baseUrl = 'https://career.millatumidi.uz';
      
      const metaData: any = {
        en: {
          home: {
            title: 'Jobs in Uzbekistan | Millat Umidi Career Portal | Tashkent Employment',
            description: 'Find top career opportunities in Uzbekistan with Millat Umidi. Leading HR platform connecting talent with employers in Tashkent, Samarkand, and across Central Asia. Apply now!',
            keywords: 'jobs Uzbekistan, careers Tashkent, employment Central Asia, Millat Umidi jobs, work in Uzbekistan, HR platform, job search Tashkent, career opportunities, remote work Uzbekistan',
            image: `${baseUrl}/logo png.png`
          },
          blog: {
            title: 'Career Insights & HR News | Millat Umidi Blog | Job Market Uzbekistan',
            description: 'Stay updated with the latest career trends, HR insights, and job market news in Uzbekistan and Central Asia. Expert advice for professionals and employers.',
            keywords: 'HR blog Uzbekistan, career advice, job market trends, professional development, employment news Central Asia, workplace tips',
            image: `${baseUrl}/logo png.png`
          }
        },
        ru: {
          home: {
            title: 'Работа в Узбекистане | Портал карьеры Миллат Умиди | Трудоустройство в Ташкенте',
            description: 'Найдите лучшие карьерные возможности в Узбекистане с Миллат Умиди. Ведущая HR платформа, соединяющая таланты с работодателями в Ташкенте, Самарканде и по всей Центральной Азии.',
            keywords: 'работа Узбекистан, карьера Ташкент, трудоустройство Центральная Азия, вакансии Миллат Умиди, работа в Узбекистане, HR платформа, поиск работы Ташкент, карьерные возможности, удаленная работа',
            image: `${baseUrl}/logo png.png`
          },
          blog: {
            title: 'Карьерные инсайты и HR новости | Блог Миллат Умиди | Рынок труда Узбекистан',
            description: 'Следите за последними карьерными трендами, HR инсайтами и новостями рынка труда в Узбекистане и Центральной Азии. Экспертные советы для профессионалов и работодателей.',
            keywords: 'HR блог Узбекистан, карьерные советы, тренды рынка труда, профессиональное развитие, новости трудоустройства Центральная Азия',
            image: `${baseUrl}/logo png.png`
          }
        },
        uz: {
          home: {
            title: 'Oʻzbekistonda ish | Millat Umidi karyera portali | Toshkentda bandlik',
            description: 'Millat Umidi bilan Oʻzbekistonda eng yaxshi karyera imkoniyatlarini toping. Toshkent, Samarqand va butun Markaziy Osiyoda iqtidorlarni ish beruvchilar bilan bogʻlovchi yetakchi HR platforma.',
            keywords: 'ish Oʻzbekiston, karyera Toshkent, bandlik Markaziy Osiya, Millat Umidi ish, Oʻzbekistonda ishlash, HR platforma, ish qidirish Toshkent, karyera imkoniyatlari, masofaviy ish',
            image: `${baseUrl}/logo png.png`
          },
          blog: {
            title: 'Karyera tushunchalari va HR yangiliklari | Millat Umidi blogi | Oʻzbekiston mehnat bozori',
            description: 'Oʻzbekiston va Markaziy Osiyodagi eng soʻnggi karyera tendensiyalari, HR tushunchalari va mehnat bozori yangiliklari bilan tanishib turing. Mutaxassislar va ish beruvchilar uchun ekspert maslahatlari.',
            keywords: 'HR blog Oʻzbekiston, karyera maslahatlari, mehnat bozori tendensiyalari, kasbiy rivojlanish, bandlik yangiliklari Markaziy Osiya',
            image: `${baseUrl}/logo png.png`
          }
        }
      };

      const langData = metaData[language] || metaData.en;
      const pageData = langData[page] || langData.home;

      res.json({
        ...pageData,
        canonical: `${baseUrl}${language === 'en' ? '' : `/${language}`}${page === 'home' ? '' : `/${page}`}`,
        locale: language === 'en' ? 'en_UZ' : `${language}_UZ`,
        alternates: [
          { hreflang: 'en', href: `${baseUrl}${page === 'home' ? '' : `/${page}`}` },
          { hreflang: 'ru-UZ', href: `${baseUrl}/ru${page === 'home' ? '' : `/${page}`}` },
          { hreflang: 'uz-UZ', href: `${baseUrl}/uz${page === 'home' ? '' : `/${page}`}` },
          { hreflang: 'x-default', href: `${baseUrl}${page === 'home' ? '' : `/${page}`}` }
        ]
      });
    } catch (error) {
      console.error('[SEO] Error generating meta data:', error);
      res.status(500).json({ error: 'Error generating meta data' });
    }
  });

  return router;
}

export default createSEORoutes;