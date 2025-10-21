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
    <footer className="relative border-t border-white/[0.08] bg-black mt-auto w-full overflow-hidden">
      
      <div className="container-responsive max-w-7xl relative z-10 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10 lg:mb-14">
          {/* Brand Section */}
          <div className="space-y-5 sm:col-span-2 lg:col-span-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">PrompX</h3>
            <p className="text-sm sm:text-base text-zinc-400 leading-relaxed max-w-xs">
              Advanced AI prompt engineering platform for creating perfect prompts with intelligent suggestions.
            </p>
          </div>

          {/* Product Links */}
          <div className="space-y-5">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">Product</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => window.location.href = '/dashboard'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-all duration-200 block py-1 hover:translate-x-1 font-medium">
                  Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/marketplace'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-all duration-200 block py-1 hover:translate-x-1 font-medium">
                  Marketplace
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/analytics'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-all duration-200 block py-1 hover:translate-x-1 font-medium">
                  Analytics
                </button>
              </li>
            </ul>
          </div>

          {/* Resources Links */}
          <div className="space-y-5">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">Resources</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => window.location.href = '/team'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-all duration-200 block py-1 hover:translate-x-1 font-medium">
                  Team
                </button>
              </li>
              <li>
                <button onClick={() => window.location.href = '/compliance'} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-all duration-200 block py-1 hover:translate-x-1 font-medium">
                  Compliance
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="space-y-5">
            <h4 className="text-xs sm:text-sm font-bold text-white tracking-widest uppercase">Legal</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => scrollToSection('privacy')} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-all duration-200 block py-1 hover:translate-x-1 font-medium">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('terms')} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-all duration-200 block py-1 hover:translate-x-1 font-medium">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => scrollToSection('cookies')} className="text-sm sm:text-base text-zinc-400 hover:text-white transition-all duration-200 block py-1 hover:translate-x-1 font-medium">
                  Cookie Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 sm:pt-10 border-t border-white/[0.08]">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <p className="text-sm text-zinc-500 text-center sm:text-left font-medium">
              © {new Date().getFullYear()} PrompX. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;