import React from 'react';

interface CardProps {
  title: string;
  description?: string;
  variant?: 'standard' | 'expanded' | 'minimal';
  children?: React.ReactNode;
  className?: string;
  headerColor?: string;
  actions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  description,
  variant = 'standard',
  children,
  className = '',
  headerColor,
  actions,
}) => {
  const getCardStyles = () => {
    const baseStyles = 'bg-white rounded-lg shadow-lexiom border border-gray-200';
    
    switch (variant) {
      case 'expanded':
        return `${baseStyles} p-6`;
      case 'minimal':
        return `${baseStyles} p-4`;
      default:
        return `${baseStyles} p-5`;
    }
  };

  const getHeaderStyles = () => {
    if (headerColor) {
      return `px-6 py-4 -mx-6 -mt-6 mb-4 rounded-t-lg text-white`;
    }
    return '';
  };

  return (
    <div className={`${getCardStyles()} ${className}`}>
      {/* Card Header */}
      {(title || description || actions) && (
        <div className={`flex items-center justify-between mb-4 ${headerColor ? getHeaderStyles() : ''}`}>
          <div className="flex-1">
            {title && (
              <h3 className={`font-soehne font-semibold text-lexiom-text ${
                variant === 'minimal' ? 'text-base' : 'text-lg'
              }`}>
                {title}
              </h3>
            )}
            {description && (
              <p className={`font-inter text-gray-600 mt-1 ${
                variant === 'minimal' ? 'text-xs' : 'text-sm'
              }`}>
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      {children && (
        <div className="font-inter text-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};