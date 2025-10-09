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
    <footer className="relative border-t border-white/10 bg-black/90 backdrop-blur-xl mt-auto w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand Section */}
          <div className="space-y-3 sm:space-y-4 sm:col-span-2 lg:col-span-1">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">PrompX</h3>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              Advanced AI prompt engineering platform for creating perfect prompts with intelligent suggestions.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-white tracking-wider uppercase">Product</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <button onClick={() => window.location.href = '/dashboard'} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/marketplace'} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/analytics'} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-white tracking-wider uppercase">Resources</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <button onClick={() => window.location.href = '/team'} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Team
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/compliance'} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Compliance
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-3 sm:space-y-4">
            <h4 className="text-xs sm:text-sm font-semibold text-white tracking-wider uppercase">Legal</h4>
            <ul className="space-y-2 sm:space-y-3">
              <li>
                <button onClick={() => scrollToSection('privacy')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('terms')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('cookies')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-200 block py-1">
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-6 sm:pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-6">
            <p className="text-xs sm:text-sm text-zinc-500 text-center sm:text-left">
              © {new Date().getFullYear()} PrompX. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-5 sm:gap-6">
              <a 
                href="https://twitter.com/prompx" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors duration-200"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/prompx" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors duration-200"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/prompx" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-white transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a 
                href="mailto:contact@prompx.com" 
                className="text-zinc-400 hover:text-white transition-colors duration-200"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;