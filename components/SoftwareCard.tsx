import Link from 'next/link';
import SmartImage from '@/components/SmartImage';
import { Software } from '@/types/software';
import { formatCompactNumber } from '@/lib/format';

interface SoftwareCardProps {
  software: Software;
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 21s-7-4.6-9.4-8.6C.6 8.7 2.5 6 5.6 6c1.7 0 3.1.9 4 2.1C10.3 6.9 11.7 6 13.4 6c3.1 0 5 2.7 3 6.4C19 16.4 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14a4 4 0 01-4 4H9l-5 3V6a4 4 0 014-4h9a4 4 0 014 4v8z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  return (
    <div className="flex gap-0.5" aria-label={`Đánh giá ${rating} trên 5`}>
      {[...Array(5)].map((_, i) => (
        <span key={i} className={i < fullStars ? 'text-amber-400' : 'text-gray-300'}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function SoftwareCard({ software }: SoftwareCardProps) {
  return (
    <Link href={`/software/${software.id}`}>
      <article className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow duration-300 ring-1 ring-black/5 h-full">
        <div className="relative bg-gray-100 aspect-[16/10] overflow-hidden">
          <SmartImage
            src={software.image || '/placeholder-software.svg'}
            alt={software.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-white/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-gray-800 ring-1 ring-black/5">
              {software.category}
            </span>
            {software.version && (
              <span className="inline-flex items-center rounded-full bg-blue-600/90 backdrop-blur px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-black/5">
                v{software.version}
              </span>
            )}
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-500 mb-2">Ngày đăng: {software.datePublished}</p>

          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 text-base group-hover:text-blue-700 transition-colors">
            {software.title}
          </h3>

          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {software.description}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Stars rating={software.rating} />
              <span className="text-xs text-gray-500">({software.rating})</span>
            </div>
            <span className="text-xs text-gray-500">
              {formatCompactNumber(software.views)} lượt xem
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-600 border-t pt-3">
            <span className="inline-flex items-center gap-1 text-gray-600">
              <span className="text-gray-400">
                <HeartIcon />
              </span>
              {formatCompactNumber(software.likes)}
            </span>
            <span className="inline-flex items-center gap-1 text-gray-600">
              <span className="text-gray-400">
                <CommentIcon />
              </span>
              {formatCompactNumber(software.comments)}
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-blue-700">
              Xem chi tiết <span aria-hidden="true">→</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

