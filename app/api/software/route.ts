import { NextResponse } from 'next/server';
import { getApprovedSoftware, searchSoftware } from '@/lib/supabase-queries';
import { softwareData } from '@/data/software';

const FALLBACK_IMAGE = '/placeholder-software.svg';

function getSafeImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return FALLBACK_IMAGE;
  if (imageUrl.includes('via.placeholder.com')) return FALLBACK_IMAGE;
  return imageUrl;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  try {
    let data;

    if (query) {
      data = await searchSoftware(query);
    } else {
      data = await getApprovedSoftware();
    }

    // Map Supabase data to Software type
    const mappedData = (data || []).map((raw) => {
      const item =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, unknown>)
          : {};

      const createdAt = typeof item.created_at === 'string' ? item.created_at : null;

      return {
        id: String(item.id ?? ''),
        title: typeof item.title === 'string' ? item.title : 'Chưa đặt tên',
        description: typeof item.description === 'string' ? item.description : '',
        image: getSafeImageUrl(typeof item.image_url === 'string' ? item.image_url : null),
        category: typeof item.category === 'string' ? item.category : 'Khác',
        rating: typeof item.rating === 'number' ? item.rating : 0,
        likes: typeof item.likes === 'number' ? item.likes : 0,
        comments: typeof item.comments === 'number' ? item.comments : 0,
        views: typeof item.views === 'number' ? item.views : 0,
        datePublished: createdAt
          ? new Date(createdAt).toLocaleDateString('vi-VN')
          : new Date().toLocaleDateString('vi-VN'),
        version: typeof item.version === 'string' ? item.version : null,
        downloadUrl: typeof item.download_url === 'string' ? item.download_url : null,
        downloadUrl2: typeof item.download_url_2 === 'string' ? item.download_url_2 : null,
        installGuide: typeof item.install_guide === 'string' ? item.install_guide : '',
        videoUrl: typeof item.video_url === 'string' ? item.video_url : '',
        installImages: Array.isArray(item.install_images) ? item.install_images : [],
      };
    });

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error('Error fetching software:', error);
    // Fallback to mock data
    return NextResponse.json(softwareData);
  }
}
