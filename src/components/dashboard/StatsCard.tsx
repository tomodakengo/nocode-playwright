'use client';

interface StatsCardProps {
  value: number | string;
  label: string;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  icon?: string;
}

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
  orange: 'text-orange-600',
  red: 'text-red-600'
};

export function StatsCard({ 
  value, 
  label, 
  description, 
  color = 'blue',
  icon 
}: StatsCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      {icon && (
        <div className="text-3xl mb-2">{icon}</div>
      )}
      <div className={`text-3xl font-bold mb-2 ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-gray-600">{label}</div>
      {description && (
        <div className="text-sm text-gray-500 mt-1">{description}</div>
      )}
    </div>
  );
}