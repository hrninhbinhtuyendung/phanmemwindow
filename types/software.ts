export interface Software {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  rating: number;
  likes: number;
  comments: number;
  views: number;
  datePublished: string;
  version?: string;
  downloadUrl?: string;
  downloadUrl2?: string;
  installGuide?: string;
  videoUrl?: string;
  installImages?: (string | null)[];
}
