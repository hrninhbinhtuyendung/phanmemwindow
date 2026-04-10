export function toYouTubeEmbedUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const value = url.trim();
  if (!value) return null;

  try {
    const parsed = new URL(value);
    const host = parsed.hostname.replace(/^www\./, '');

    // https://www.youtube.com/watch?v=VIDEO_ID
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v');
      if (id) return `https://www.youtube.com/embed/${id}`;
      // https://youtube.com/embed/VIDEO_ID
      const parts = parsed.pathname.split('/').filter(Boolean);
      if (parts[0] === 'embed' && parts[1]) return `https://www.youtube.com/embed/${parts[1]}`;
    }

    // https://youtu.be/VIDEO_ID
    if (host === 'youtu.be') {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
  } catch {
    // ignore
  }

  return null;
}

