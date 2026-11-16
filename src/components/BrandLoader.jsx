import { Loader2 } from 'lucide-react';

export default function BrandLoader({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <Loader2 className="h-6 w-6 animate-spin text-brand-terra" />
    </div>
  );
}