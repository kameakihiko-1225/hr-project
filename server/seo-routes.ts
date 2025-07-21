import type { Express } from "express";
import { storage } from "./storage";

export function registerSEORoutes(app: Express) {
  // XML Sitemap endpoint for search engines
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const baseUrl = "https://career.millatumidi.uz";
      const currentDate = new Date().toISOString();
      
      // Get all positions for sitemap
      const positions = await storage.getAllPositions();
      const companies = await storage.getAllCompanies();
      
      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="uz" href="${baseUrl}/?lang=uz"/>
  </url>
  
  <!-- Blog page -->
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/blog?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/blog?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="uz" href="${baseUrl}/blog?lang=uz"/>
  </url>
`;

      // Add position pages
      positions.forEach((position: any) => {
        sitemap += `
  <url>
    <loc>${baseUrl}/positions/${position.id}</loc>
    <lastmod>${position.createdAt}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/positions/${position.id}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/positions/${position.id}?lang=ru"/>
    <xhtml:link rel="alternate" hreflang="uz" href="${baseUrl}/positions/${position.id}?lang=uz"/>
  </url>`;
      });

      sitemap += `
</urlset>`;

      res.set({
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
      });
      res.send(sitemap);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt endpoint
  app.get("/robots.txt", (req, res) => {
    const robots = `User-agent: *
Allow: /

# Priority pages for search engines
Allow: /positions/*
Allow: /sitemap.xml

# Block admin pages from search engines
Disallow: /admin/
Disallow: /api/

# Sitemaps
Sitemap: https://career.millatumidi.uz/sitemap.xml

# Crawl delay for better server performance
Crawl-delay: 1`;

    res.set({
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    res.send(robots);
  });

  // SEO-optimized search endpoint for structured data
  app.get("/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const language = req.query.language as string || 'en';
      
      if (!query) {
        return res.redirect('/');
      }
      
      // Search positions by title and description
      const positions = await storage.getAllPositions(undefined, language);
      const filteredPositions = positions.filter((position: any) => 
        position.title?.toLowerCase().includes(query.toLowerCase()) ||
        position.description?.toLowerCase().includes(query.toLowerCase())
      );
      
      // Return search results with SEO optimization
      res.json({
        success: true,
        data: {
          query,
          results: filteredPositions,
          totalResults: filteredPositions.length,
          searchTime: Date.now()
        }
      });
    } catch (error) {
      console.error('Error in search endpoint:', error);
      res.status(500).json({ success: false, error: "Search failed" });
    }
  });
}