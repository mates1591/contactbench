import Link from 'next/link';
import { FaGithub, FaTwitter, FaLinkedin, FaInstagram } from 'react-icons/fa6';

const companyLinks = [
  { name: 'About', href: '/about' },
  { name: 'Team', href: '/team' },
  { name: 'Careers', href: '/careers' },
  { name: 'Blog', href: '/blog' }
];

const productLinks = [
  { name: 'Features', href: '/features' },
  { name: 'Pricing', href: '/pricing' },
  { name: 'Case Studies', href: '/case-studies' },
  { name: 'API', href: '/api' }
];

const resourceLinks = [
  { name: 'Documentation', href: '/docs' },
  { name: 'Guides', href: '/guides' },
  { name: 'Support Center', href: '/support' },
  { name: 'Contact Sales', href: '/contact' }
];

const legalLinks = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms of Service', href: '/terms' },
  { name: 'Cookie Policy', href: '/cookies' },
  { name: 'GDPR', href: '/gdpr' }
];

export function Footer() {
  return (
    <footer className="bg-neutral-dark border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Company Overview */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl text-white font-bold">Contact<span className="gradient-text">Bench</span></span>
            </div>
            <p className="secondary-text mb-4 max-w-md">
              Generate targeted B2B contact databases by specifying business criteria. 
              Get accurate, verified contacts for your sales and marketing campaigns.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <FaTwitter size={20} />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <FaLinkedin size={20} />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <FaGithub size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-primary">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>
          
          {/* Link Sections */}
          <div>
            <h3 className="font-medium text-white mb-4">Company</h3>
            <ul className="space-y-2">
              {companyLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-4">Product</h3>
            <ul className="space-y-2">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium text-white mb-4">Resources</h3>
            <ul className="space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.name}>
                  <Link 
                    href={link.href}
                    className="text-gray-400 hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} ContactBench. All rights reserved.
          </p>
          
          <div className="flex flex-wrap mt-4 md:mt-0 gap-4">
            {legalLinks.map((link) => (
              <Link 
                key={link.name} 
                href={link.href}
                className="text-gray-400 hover:text-primary text-sm"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
} 