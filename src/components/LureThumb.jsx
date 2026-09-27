import { Fish } from 'lucide-react';
import { photoUrl } from '../lib/api';

export default function LureThumb({ photoKey, alt, className = 'w-12 h-12' }) {
  const src = photoUrl(photoKey);
  return src ? (
    <img src={src} alt={alt} loading="lazy" className={`${className} rounded-lg object-cover border border-slate-800`} />
  ) : (
    <div className={`${className} rounded-lg border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-600`}>
      <Fish className="w-5 h-5" />
    </div>
  );
}
