import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

export const ContactSection = () => {
  const { t } = useTranslation();
  const handleEmailClick = () => {
    window.open('mailto:career@millatumidi.uz', '_blank');
  };

  const handlePhoneClick = () => {
    window.open('tel:+998712000306', '_blank');
  };

  const handleMapClick = () => {
    window.open('https://maps.google.com/?q=Chilonzor+2-Charkh+Kamolon+100043+Tashkent', '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-700/30">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('contact.title')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Contact Information */}
            <div className="space-y-8">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md">
                  <img 
                    src="/logo png.png" 
                    alt="Millat Umidi Group" 
                    className="h-12 w-12 object-contain rounded-full"
                  />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('footer.company_name')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    {t('contact.company_description')}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={handleEmailClick}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{t('contact.email')}</h4>
                        <p className="text-blue-600 dark:text-blue-400 hover:underline">
                          career@millatumidi.uz
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={handlePhoneClick}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{t('contact.phone')}</h4>
                        <p className="text-green-600 dark:text-green-400 hover:underline">
                          +998 71 200 03 06
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200" onClick={handleMapClick}>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                        <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{t('contact.address')}</h4>
                        <p className="text-purple-600 dark:text-purple-400 hover:underline">
                          Chilonzor 2-Charkh Kamolon 100043, Tashkent
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Map */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <span>{t('contact.our_location')}</span>
                  </CardTitle>
                  <CardDescription>
                    {t('contact.visit_us')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.4!2d69.2!3d41.3!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDHCsDE4JzAwLjAiTiA2OcKwMTInMDAuMCJF!5e0!3m2!1sen!2s!4v1642000000000!5m2!1sen!2s"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Millat Umidi Group Location"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Ready to Join Our Team?
                    </h4>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Send us your resume and let's discuss your future with us.
                    </p>
                    <Button 
                      onClick={handleEmailClick}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      Apply Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};