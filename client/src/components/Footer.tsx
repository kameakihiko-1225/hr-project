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

export const Footer = () => {
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
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
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
                  Millat Umidi Group
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Building Tomorrow's Education
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Transforming education across Uzbekistan with innovative
              technology and passionate leadership.
            </p>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contact Us
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
              Quick Links
            </h3>
            <div className="space-y-2">
              <a
                href="/"
                className="block text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
              >
                Home
              </a>
              <a
                href="/gallery"
                className="block text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
              >
                Gallery
              </a>
              <a
                href="#contact"
                className="block text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 transition-colors"
              >
                Contact
              </a>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Follow Us
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

          {/* Map */}
          <div className="space-y-4 md:col-span-2 lg:col-span-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Location</h3>
            <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2996.249!2d69.194489!3d41.317638!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38ae8b342a4a6c77%3A0x123456789abcdef0!2sChilonzor%2C%20Tashkent%2C%20Uzbekistan!5e0!3m2!1sen!2s!4v1642000000000!5m2!1sen!2s"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Millat Umidi Group Location"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Millat Umidi Group. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
