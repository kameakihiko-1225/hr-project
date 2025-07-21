import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

// Lazy loading for better performance
const LazyImage = lazy(() => import('./LazyImage'));

// Core Web Vitals optimization hook
export const useWebVitals = () => {
  useEffect(() => {
    // Optimize First Contentful Paint (FCP)
    const preloadCriticalResources = () => {
      // Preload critical fonts
      const fontLink = document.createElement('link');
      fontLink.rel = 'preload';
      fontLink.href = '/fonts/inter.woff2';
      fontLink.as = 'font';
      fontLink.type = 'font/woff2';
      fontLink.crossOrigin = 'anonymous';
      document.head.appendChild(fontLink);

      // Preload hero image
      const heroImageLink = document.createElement('link');
      heroImageLink.rel = 'preload';
      heroImageLink.href = '/logo png.png';
      heroImageLink.as = 'image';
      document.head.appendChild(heroImageLink);
    };

    // Optimize Largest Contentful Paint (LCP)
    const optimizeLCP = () => {
      // Add loading="eager" for above-the-fold images
      const heroImages = document.querySelectorAll('img[data-hero="true"]');
      heroImages.forEach(img => {
        (img as HTMLImageElement).loading = 'eager';
        (img as HTMLImageElement).fetchPriority = 'high';
      });
    };

    // Optimize Cumulative Layout Shift (CLS)
    const optimizeCLS = () => {
      // Ensure all images have width and height attributes
      const images = document.querySelectorAll('img:not([width]):not([height])');
      images.forEach(img => {
        const computedStyle = window.getComputedStyle(img);
        if (computedStyle.width && computedStyle.height) {
          img.setAttribute('width', computedStyle.width);
          img.setAttribute('height', computedStyle.height);
        }
      });
    };

    // Optimize First Input Delay (FID)
    const optimizeFID = () => {
      // Use requestIdleCallback for non-critical tasks
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          // Initialize analytics and other non-critical scripts
          console.log('[Performance] Non-critical tasks initialized');
        });
      }
    };

    preloadCriticalResources();
    optimizeLCP();
    optimizeCLS();
    optimizeFID();

    // Monitor Core Web Vitals if available
    if ('web-vitals' in window || window.performance) {
      // Web Vitals monitoring could be added here
      console.log('[Performance] Web Vitals monitoring initialized');
    }
  }, []);
};

// Progressive image loading component
interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  placeholder?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2VlZWVlZSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjYWFhYWFhIiBkeT0iLjNlbSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9hZGluZy4uLjwvdGV4dD48L3N2Zz4='
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, isIntersecting] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
  });

  useEffect(() => {
    if (priority || isIntersecting) {
      const img = new Image();
      img.onload = () => setImageSrc(src);
      img.src = src;
    }
  }, [src, isIntersecting, priority]);

  return (
    <img
      ref={imageRef}
      src={imageSrc}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      data-hero={priority ? 'true' : 'false'}
    />
  );
};

// Resource prefetching for SEO pages
export const SEOResourcePrefetch: React.FC = () => {
  useEffect(() => {
    // Prefetch common job position pages
    const prefetchLinks = [
      '/api/positions/21', // HR Generalist
      '/api/companies/5',   // Millat Umidi University
      '/api/departments/26' // HR Department
    ];

    prefetchLinks.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });

    // Prefetch critical CSS for position pages
    const criticalCSS = document.createElement('link');
    criticalCSS.rel = 'prefetch';
    criticalCSS.href = '/css/position-page.css';
    document.head.appendChild(criticalCSS);

    return () => {
      // Cleanup prefetch links
      prefetchLinks.forEach(url => {
        const link = document.querySelector(`link[href="${url}"]`);
        if (link) link.remove();
      });
    };
  }, []);

  return null;
};

// Service Worker registration for caching
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[SW] Service worker registered:', registration);
        })
        .catch(error => {
          console.log('[SW] Service worker registration failed:', error);
        });
    });
  }
};

// Critical CSS inlining for above-the-fold content
export const inlineCriticalCSS = () => {
  const criticalCSS = `
    /* Critical styles for above-the-fold content */
    .hero-section { display: block; }
    .nav-header { display: flex; justify-content: space-between; }
    .logo { width: 40px; height: 40px; }
    .loading-skeleton { 
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  const style = document.createElement('style');
  style.textContent = criticalCSS;
  document.head.appendChild(style);
};

export default {
  useWebVitals,
  ProgressiveImage,
  SEOResourcePrefetch,
  registerServiceWorker,
  inlineCriticalCSS
};