import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
  ExternalLink,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  const handleEmailClick = () => {
    window.open("mailto:career@millatumidi.uz", "_blank");
  };

  const handlePhoneClick = () => {
    window.open("tel:+998712000306", "_blank");
  };

  const handleMapClick = () => {
    window.open("https://maps.app.goo.gl/mKXXDhe2GL7ZKBdK8", "_blank");
  };

  return (
    <footer
      id="contact"
      className="bg-gradient-to-br from-gray-50 to-blue-50/30 dark:from-gray-900 dark:to-gray-800 border-t border-gray-100 dark:border-gray-800"
    >
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src="/logo png.png"
                alt="Millat Umidi Group"
                className="h-12 w-12 object-contain rounded-full"
              />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('footer.company_name')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {t('footer.company_tagline')}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('footer.company_description')}
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('footer.contact_us')}
            </h3>
            <div className="space-y-3">
              <div
                className="flex items-center space-x-3 cursor-pointer hover:text-blue-600 transition-colors"
                onClick={handleEmailClick}
              >
                <Mail className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600">
                  career@millatumidi.uz
                </span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>

              <div
                className="flex items-center space-x-3 cursor-pointer hover:text-green-600 transition-colors"
                onClick={handlePhoneClick}
              >
                <Phone className="h-4 w-4 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-300 hover:text-green-600">
                  +998 71 200 03 06
                </span>
                <ExternalLink className="h-3 w-3 text-gray-400" />
              </div>

              <div
                className="flex items-start space-x-3 cursor-pointer hover:text-purple-600 transition-colors"
                onClick={handleMapClick}
              >
                <MapPin className="h-4 w-4 text-purple-600 mt-0.5" />
                <div className="flex-1">
                  <span className="text-sm text-gray-600 dark:text-gray-300 hover:text-purple-600">
                    Chilonzor 2-Charkh Kamolon 100043, Tashkent
                  </span>
                  <ExternalLink className="h-3 w-3 text-gray-400 inline ml-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('footer.quick_links')}
            </h3>
            <div className="space-y-2">
              <a
                href="/"
                className="block text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
              >
                {t('home')}
              </a>
              <a
                href="/blog"
                className="block text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
              >
                {t('blog')}
              </a>
              <a
                href="#contact"
                className="block text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
              >
                {t('contact')}
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('footer.follow_us')}
            </h3>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-blue-700 transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-pink-600 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} {t('footer.company_name')}. {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};
