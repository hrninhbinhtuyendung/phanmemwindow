'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import SmartImage from '@/components/SmartImage';
import GetLinkButton from '@/components/GetLinkButton';
import { Software } from '@/types/software';
import { formatCompactNumber } from '@/lib/format';
import { toYouTubeEmbedUrl } from '@/lib/youtube';
import { trackDownloadOpen, trackSoftwareView } from '@/lib/analytics-client';

function Stars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  return (
    <div className="flex gap-0.5" aria-label={`Đánh giá ${rating} trên 5`}>
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={i < fullStars ? 'text-amber-400 text-lg' : 'text-gray-300 text-lg'}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function SoftwareDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [software, setSoftware] = useState<Software | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await fetch(`/api/software/${id}`);
        if (!response.ok) {
          setSoftware(null);
          return;
        }
        const data = await response.json();
        setSoftware(data);
      } catch {
        setSoftware(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  useEffect(() => {
    if (!software?.id) return;
    trackSoftwareView(software.id);
  }, [software?.id]);

  if (!loading && !software) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-6 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <Link
            href="/"
            className="text-blue-100 hover:text-white mb-4 inline-flex items-center gap-2"
          >
            ← Quay lại
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden animate-pulse">
            <div className="bg-gray-200 aspect-[16/9]" />
            <div className="p-8 space-y-4">
              <div className="h-6 w-2/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="h-24 w-full bg-gray-200 rounded" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-black/5 overflow-hidden">
            <div className="w-full bg-gray-100 overflow-hidden aspect-[16/9]">
              <SmartImage
                src={software?.image || '/placeholder-software.svg'}
                alt={software?.title || 'Software'}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-blue-100">
                  {software?.category}
                </span>
                {software?.version && (
                  <span className="inline-flex bg-gray-50 text-gray-700 px-3 py-1 rounded-full text-sm font-semibold ring-1 ring-gray-200">
                    Phiên bản {software.version}
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  Ngày đăng: {software?.datePublished}
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">
                {software?.title}
              </h1>

              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                <Stars rating={software?.rating || 0} />
                <span className="text-gray-600">({software?.rating || 0}/5)</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">
                  {formatCompactNumber(software?.views || 0)} lượt xem
                </span>
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Mô tả</h2>
                <p className="text-gray-700 leading-relaxed">
                  {software?.description}
                </p>
              </div>

              {(software?.installGuide || software?.videoUrl) && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Hướng dẫn cài đặt</h2>

                  {software?.installGuide ? (
                    <div className="space-y-4">
                      {software.installGuide
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((stepText, idx) => {
                          const rawStepImage =
                            Array.isArray(software.installImages) ? software.installImages[idx] : null;
                          const stepImage =
                            typeof rawStepImage === 'string' && rawStepImage.length > 0
                              ? rawStepImage
                              : undefined;

                          return (
                            <div
                              key={idx}
                              className="bg-white rounded-2xl ring-1 ring-gray-200 overflow-hidden"
                            >
                              <div className="p-4">
                                <div className="flex items-start gap-3">
                                  <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-sm font-extrabold ring-1 ring-blue-100">
                                    {idx + 1}
                                  </span>
                                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                    {stepText}
                                  </p>
                                </div>
                              </div>

                              {stepImage && (
                                <a
                                  href={stepImage}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block border-t bg-gray-50"
                                  aria-label={`Mở ảnh bước ${idx + 1}`}
                                >
                                  <img
                                    src={stepImage}
                                    alt={`Ảnh bước ${idx + 1}`}
                                    className="w-full h-72 object-cover"
                                    loading="lazy"
                                  />
                                </a>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    Array.isArray(software?.installImages) &&
                    software.installImages.length > 0 && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {software.installImages
                          .filter((src): src is string => typeof src === 'string' && src.length > 0)
                          .map((src, idx) => (
                          <a
                            key={idx}
                            href={src}
                            target="_blank"
                            rel="noreferrer"
                            className="block overflow-hidden rounded-2xl ring-1 ring-gray-200 bg-gray-50"
                            aria-label={`Mở ảnh hướng dẫn ${idx + 1}`}
                          >
                            <img
                              src={src}
                              alt={`Ảnh hướng dẫn ${idx + 1}`}
                              className="w-full h-64 object-cover"
                              loading="lazy"
                            />
                          </a>
                          ))}
                      </div>
                    )
                  )}

                  {software?.videoUrl && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <p className="text-sm text-gray-600">Video hướng dẫn</p>
                        <a
                          href={software.videoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                          Mở YouTube →
                        </a>
                      </div>

                      {toYouTubeEmbedUrl(software.videoUrl) && (
                        <div className="mt-3 aspect-video overflow-hidden rounded-2xl ring-1 ring-gray-200 bg-black/5">
                          <iframe
                            src={toYouTubeEmbedUrl(software.videoUrl) as string}
                            title="YouTube video"
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allowFullScreen
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 p-4 md:p-6 bg-gray-50 rounded-2xl ring-1 ring-gray-100">
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                    {formatCompactNumber(software?.likes || 0)}
                  </p>
                  <p className="text-gray-600 text-xs md:text-sm">Lượt thích</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                    {formatCompactNumber(software?.comments || 0)}
                  </p>
                  <p className="text-gray-600 text-xs md:text-sm">Bình luận</p>
                </div>
                <div className="text-center">
                  <p className="text-xl md:text-2xl font-extrabold text-gray-900">
                    {formatCompactNumber(software?.views || 0)}
                  </p>
                  <p className="text-gray-600 text-xs md:text-sm">Lượt xem</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <GetLinkButton
                    url={software?.downloadUrl}
                    waitSeconds={30}
                    onOpen={() => {
                      if (software?.id) trackDownloadOpen({ softwareId: software.id, source: 'primary' });
                    }}
                    label="Get link tải"
                    readyLabel="Mở link tải"
                    className="w-full rounded-xl py-3 px-6 transition-colors text-center font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabledLabel="Chưa có link"
                  />
                </div>
                <div className="flex-1">
                  <GetLinkButton
                    url={software?.downloadUrl2}
                    waitSeconds={30}
                    onOpen={() => {
                      if (software?.id) trackDownloadOpen({ softwareId: software.id, source: 'backup' });
                    }}
                    label="Get link dự phòng"
                    readyLabel="Mở link dự phòng"
                    className="w-full rounded-xl py-3 px-6 transition-colors text-center font-bold bg-white hover:bg-gray-50 text-gray-900 ring-1 ring-gray-200 disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabledLabel="Chưa có link"
                  />
                </div>
                <Link
                  href="/"
                  className="flex-1 bg-white hover:bg-gray-50 text-gray-900 font-bold py-3 px-6 rounded-xl transition-colors text-center ring-1 ring-gray-200"
                >
                  Quay lại danh sách
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
