'use client';

import Link from 'next/link';

interface QuickStartCardProps {
  title: string;
  description: string;
  link: string;
  color: string;
  textColor: string;
  bgColor: string;
}

export function QuickStartCard({ 
  title, 
  description, 
  link, 
  color, 
  textColor, 
  bgColor 
}: QuickStartCardProps) {
  return (
    <Link
      href={link}
      className={`block p-6 rounded-lg border-2 ${bgColor} hover:shadow-lg transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
      aria-label={`${title}: ${description}`}
    >
      <div className="text-center">
        <h3 className={`text-xl font-bold ${textColor} mb-3`}>
          {title}
        </h3>
        <p className="text-gray-700 mb-4">{description}</p>
        <div className={`inline-flex items-center px-4 py-2 text-white rounded-lg ${color} transition-colors`}>
          開始 →
        </div>
      </div>
    </Link>
  );
}