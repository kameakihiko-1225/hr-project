import { Button } from "@/components/ui/button";
// Use the logo from public directory instead
// import founderImage from "@assets/Umidjon_aka-removebg-preview_1752578772239.png";

export const FounderSection = () => {
  const scrollToPositions = () => {
    const positionsSection = document.getElementById('open-positions');
    if (positionsSection) {
      positionsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <section className="relative bg-white dark:bg-gray-950 py-20 px-4 overflow-hidden">
      {/* Subtle background decoration - same as hero */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/40 via-transparent to-indigo-50/30 dark:from-blue-950/30 dark:via-transparent dark:to-indigo-950/20"></div>
      
      <div className="max-w-6xl mx-auto relative">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left side - Founder Photo */}
          <div className="flex flex-col items-center lg:items-center space-y-6 order-2 lg:order-1">
            <div className="relative overflow-hidden">
              <img
                src="/Umidjon_aka-removebg-preview_1752578772239.png"
                alt="Umidjon Ishmukhamedov"
                className="w-96 h-auto lg:w-[28rem] lg:h-auto object-contain drop-shadow-2xl"
                style={{ clipPath: 'inset(0 0 20% 0)' }}
              />
            </div>
            
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Umidjon Ishmukhamedov
              </h3>
              <p className="text-lg text-blue-600 dark:text-blue-400 font-semibold">
                Founder of Millat Umidi Group
              </p>
            </div>
          </div>

          {/* Right side - Inspirational Message */}
          <div className="space-y-6 order-1 lg:order-2">
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight">
                Join Our Mission to 
                <span className="text-blue-600 dark:text-blue-400"> Transform Education</span>
              </h2>
              
              <div className="prose prose-lg text-gray-700 dark:text-gray-300 max-w-none">
                <p className="text-lg leading-relaxed mb-4">
                  "At Millat Umidi, we believe that education is the foundation of a prosperous society. 
                  Our journey began with a simple vision: to create world-class educational institutions 
                  that nurture young minds and prepare them for tomorrow's challenges."
                </p>
                
                <p className="text-lg leading-relaxed mb-4">
                  "We are not just building schools and universities; we are building dreams, 
                  shaping futures, and creating opportunities for the next generation. Every member 
                  of our team plays a crucial role in this transformative mission."
                </p>
                
                <p className="text-lg leading-relaxed font-semibold text-blue-600 dark:text-blue-400">
                  "Join us in making a lasting impact on education in Uzbekistan and beyond. 
                  Together, we can build a brighter future for our nation's youth."
                </p>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={scrollToPositions}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300"
              >
                <span className="hidden sm:inline">Explore Career Opportunities</span>
                <span className="sm:hidden">Careers</span>
                <svg 
                  className="ml-2 w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 8l4 4m0 0l-4 4m4-4H3" 
                  />
                </svg>
              </Button>
            </div>

            {/* Optional: Add some stats or achievements */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">15+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Years of Experience</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Students Impacted</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};