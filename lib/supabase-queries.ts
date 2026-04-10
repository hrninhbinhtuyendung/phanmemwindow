import { Software } from '@/types/software';
import { SoftwareSubmissionRow } from '@/types/supabase';
import { supabase } from './supabase';

const FALLBACK_IMAGE = '/placeholder-software.svg';

export async function getApprovedSoftware(): Promise<SoftwareSubmissionRow[]> {
  const { data, error } = await supabase
    .from('software_submissions')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching software:', error);
    return [];
  }

  return (data as SoftwareSubmissionRow[]) || [];
}

export async function getSoftwareById(id: string): Promise<SoftwareSubmissionRow | null> {
  const { data, error } = await supabase
    .from('software_submissions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching software:', error);
    return null;
  }

  return (data as SoftwareSubmissionRow) || null;
}

export async function uploadSoftware(
  software: Omit<Software, 'id' | 'created_at'> & { uploaded_by?: string }
): Promise<SoftwareSubmissionRow | null> {
  const { data, error } = await supabase
    .from('software_submissions')
    .insert([
      {
        title: software.title,
        description: software.description,
        category: software.category,
        version: software.version,
        image_url: software.image || FALLBACK_IMAGE,
        download_url: software.downloadUrl,
        rating: software.rating || 0,
        views: software.views || 0,
        likes: software.likes || 0,
        comments: software.comments || 0,
        uploaded_by: software.uploaded_by,
        status: 'pending',
      },
    ])
    .select();

  if (error) {
    console.error('Error uploading software:', error);
    return null;
  }

  return (data?.[0] as SoftwareSubmissionRow) || null;
}

export async function uploadImage(
  file: File,
  bucketName: string = 'software-images'
): Promise<string | null> {
  try {
    const sanitizedName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase()
      .substring(0, 50);

    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${sanitizedName}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    if (!data) {
      console.error('No data returned from upload');
      return null;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Upload exception:', error);
    return null;
  }
}

export async function getUserSubmissions(userId: string): Promise<SoftwareSubmissionRow[]> {
  const { data, error } = await supabase
    .from('software_submissions')
    .select('*')
    .eq('uploaded_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user submissions:', error);
    return [];
  }

  return (data as SoftwareSubmissionRow[]) || [];
}

export async function deleteSoftware(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('software_submissions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting software:', error);
    return false;
  }

  return true;
}

export async function searchSoftware(query: string): Promise<SoftwareSubmissionRow[]> {
  const { data, error } = await supabase
    .from('software_submissions')
    .select('*')
    .eq('status', 'approved')
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching software:', error);
    return [];
  }

  return (data as SoftwareSubmissionRow[]) || [];
}

