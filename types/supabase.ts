export interface SoftwareSubmissionRow {
  id: string;
  title: string | null;
  description: string | null;
  category: string | null;
  version: string | null;
  image_url: string | null;
  download_url: string | null;
  download_url_2: string | null;
  install_guide: string | null;
  video_url: string | null;
  install_images: (string | null)[] | null;
  uploaded_by: string | null;
  rating: number | null;
  likes: number | null;
  comments: number | null;
  views: number | null;
  status: 'pending' | 'approved' | 'rejected' | string | null;
  created_at: string | null;
  updated_at: string | null;
}
