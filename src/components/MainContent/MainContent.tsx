import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface MainContentProps {
  title?: string;
  breadcrumbs?: BreadcrumbItem[];
  children?: React.ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({ 
  title = 'Painel Principal',
  breadcrumbs = [],
  children 
}) => {
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Início', href: '/' },
    { label: title },
  ];

  const finalBreadcrumbs = breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <main className="flex-1 bg-lexiom-background min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <nav className="flex items-center space-x-2 text-sm">
          <Home className="w-4 h-4 text-gray-500" />
          {finalBreadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              {item.href ? (
                <a
                  href={item.href}
                  className="text-gray-600 hover:text-lexiom-primary transition-colors font-inter"
                >
                  {item.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium font-inter">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Content Header */}
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-soehne font-bold text-lexiom-text">
            {title}
          </h1>
          <div className="flex items-center space-x-3">
            {/* Action buttons can be added here */}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </main>
  );
};