import React, { useEffect } from 'react';

// Google Analytics and Yandex.Metrica integration for Central Asia
export const AnalyticsIntegration: React.FC = () => {
  useEffect(() => {
    // Google Analytics 4 setup for Central Asia markets
    const initGoogleAnalytics = () => {
      // Create GA4 script tag
      const gaScript = document.createElement('script');
      gaScript.async = true;
      gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
      document.head.appendChild(gaScript);

      // Initialize GA4
      window.dataLayer = window.dataLayer || [];
      function gtag(...args: any[]) {
        window.dataLayer.push(args);
      }
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID', {
        // Central Asia specific configuration
        country: 'UZ',
        region: 'Central Asia',
        language: 'multi',
        enhanced_measurement: true,
        page_title: document.title,
        page_location: window.location.href,
        custom_parameters: {
          market: 'central_asia',
          platform: 'career_portal',
          languages_supported: 'en,ru,uz'
        }
      });

      // Track job application events
      gtag('event', 'page_view', {
        page_title: 'Millat Umidi Career Portal',
        page_location: window.location.href,
        content_group1: 'Job Portal',
        content_group2: 'Central Asia',
        content_group3: 'Multilingual'
      });
    };

    // Yandex.Metrica setup for Russian-speaking audience
    const initYandexMetrica = () => {
      const ymScript = document.createElement('script');
      ymScript.innerHTML = `
        (function(m,e,t,r,i,k,a){
          m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
          m[i].l=1*new Date();
          k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
        })(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

        ym(YANDEX_COUNTER_ID, "init", {
          clickmap:true,
          trackLinks:true,
          accurateTrackBounce:true,
          webvisor:true,
          trackHash:true,
          ecommerce:"dataLayer"
        });
      `;
      document.head.appendChild(ymScript);

      // Yandex noscript fallback
      const noscript = document.createElement('noscript');
      noscript.innerHTML = '<div><img src="https://mc.yandex.ru/watch/YANDEX_COUNTER_ID" style="position:absolute; left:-9999px;" alt="" /></div>';
      document.body.appendChild(noscript);
    };

    // Search Console verification
    const addSearchConsoleVerification = () => {
      // Google Search Console
      const googleVerification = document.createElement('meta');
      googleVerification.name = 'google-site-verification';
      googleVerification.content = 'GOOGLE_VERIFICATION_CODE';
      document.head.appendChild(googleVerification);

      // Yandex Search Console
      const yandexVerification = document.createElement('meta');
      yandexVerification.name = 'yandex-verification';
      yandexVerification.content = 'YANDEX_VERIFICATION_CODE';
      document.head.appendChild(yandexVerification);
    };

    // Custom events for job portal
    const setupCustomEvents = () => {
      // Job view tracking
      window.addEventListener('job-view', (event: any) => {
        gtag('event', 'job_view', {
          job_id: event.detail.jobId,
          job_title: event.detail.jobTitle,
          company: event.detail.company,
          location: event.detail.location,
          language: event.detail.language
        });
      });

      // Job application tracking
      window.addEventListener('job-apply', (event: any) => {
        gtag('event', 'job_application', {
          job_id: event.detail.jobId,
          job_title: event.detail.jobTitle,
          company: event.detail.company,
          source: 'career_portal',
          value: 1
        });

        // Yandex goal tracking
        ym(0, 'reachGoal', 'job_application', {
          job_id: event.detail.jobId,
          job_title: event.detail.jobTitle
        });
      });

      // Language change tracking
      window.addEventListener('language-change', (event: any) => {
        gtag('event', 'language_change', {
          previous_language: event.detail.previous,
          new_language: event.detail.current,
          page: window.location.pathname
        });
      });
    };

    // Performance monitoring
    const setupPerformanceMonitoring = () => {
      // Core Web Vitals monitoring
      if ('web-vitals' in window) {
        // This would integrate with web-vitals library if installed
        console.log('[Analytics] Web Vitals monitoring initialized');
      }

      // Custom performance metrics
      window.addEventListener('load', () => {
        const loadTime = performance.now();
        gtag('event', 'page_load_time', {
          value: Math.round(loadTime),
          custom_parameter: 'career_portal_load'
        });
      });
    };

    // Initialize all analytics (only in production)
    if (process.env.NODE_ENV === 'production') {
      initGoogleAnalytics();
      initYandexMetrica();
      addSearchConsoleVerification();
      setupCustomEvents();
      setupPerformanceMonitoring();
    } else {
      console.log('[Analytics] Analytics disabled in development mode');
    }

    // Cleanup function
    return () => {
      // Remove event listeners
      window.removeEventListener('job-view', () => {});
      window.removeEventListener('job-apply', () => {});
      window.removeEventListener('language-change', () => {});
    };
  }, []);

  return null; // This component doesn't render anything
};

// Helper functions for tracking events
export const trackJobView = (jobId: number, jobTitle: string, company: string, location: string, language: string) => {
  const event = new CustomEvent('job-view', {
    detail: { jobId, jobTitle, company, location, language }
  });
  window.dispatchEvent(event);
};

export const trackJobApplication = (jobId: number, jobTitle: string, company: string) => {
  const event = new CustomEvent('job-apply', {
    detail: { jobId, jobTitle, company }
  });
  window.dispatchEvent(event);
};

export const trackLanguageChange = (previousLanguage: string, newLanguage: string) => {
  const event = new CustomEvent('language-change', {
    detail: { previous: previousLanguage, current: newLanguage }
  });
  window.dispatchEvent(event);
};

// Declare global types
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    ym: (id: number, action: string, target?: string, params?: any) => void;
  }
}

export default AnalyticsIntegration;