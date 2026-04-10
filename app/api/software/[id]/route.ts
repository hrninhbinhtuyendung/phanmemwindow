import { NextResponse } from 'next/server';
import { getSoftwareById } from '@/lib/supabase-queries';

const FALLBACK_IMAGE = '/placeholder-software.svg';

function getSafeImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return FALLBACK_IMAGE;
  if (imageUrl.includes('via.placeholder.com')) return FALLBACK_IMAGE;
  return imageUrl;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const item = await getSoftwareById(id);
    if (!item) {
      return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({
      id: item.id,
      title: item.title ?? 'Chưa đặt tên',
      description: item.description ?? '',
      image: getSafeImageUrl(item.image_url),
      category: item.category ?? 'Khác',
      rating: item.rating || 0,
      likes: item.likes || 0,
      comments: item.comments || 0,
      views: item.views || 0,
      datePublished: item.created_at
        ? new Date(item.created_at).toLocaleDateString('vi-VN')
        : new Date().toLocaleDateString('vi-VN'),
      version: item.version,
      downloadUrl: item.download_url,
      downloadUrl2: item.download_url_2,
      installGuide: item.install_guide ?? '',
      videoUrl: item.video_url ?? '',
      installImages: Array.isArray(item.install_images) ? item.install_images : [],
    });
  } catch (error) {
    console.error('Error fetching software by id:', error);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
