import React from 'react';
import { Github, Twitter, Linkedin, Mail } from 'lucide-react';

export const Footer = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <footer className="relative border-t border-white/10 bg-black/95 backdrop-blur-xl mt-auto w-full">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 py-10 sm:py-12 md:py-14 lg:py-16 max-w-7xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-10 lg:mb-12">
          {/* Brand Section */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">PrompX</h3>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-sm">
              Advanced AI prompt engineering platform for creating perfect prompts with intelligent suggestions.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-4">
            <h4 className="text-sm sm:text-base font-semibold text-white tracking-wider uppercase">Product</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => window.location.href = '/dashboard'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/marketplace'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/analytics'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-4">
            <h4 className="text-sm sm:text-base font-semibold text-white tracking-wider uppercase">Resources</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => window.location.href = '/team'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Team
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/compliance'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Compliance
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-4">
            <h4 className="text-sm sm:text-base font-semibold text-white tracking-wider uppercase">Legal</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => scrollToSection('privacy')} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('terms')} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('cookies')} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 sm:pt-10 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-sm sm:text-base text-zinc-500 text-center sm:text-left">
              © {new Date().getFullYear()} PrompX. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;