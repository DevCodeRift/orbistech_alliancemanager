import { createClient } from '@supabase/supabase-js';

// Optional: If you want to use Supabase for file storage (alliance logos, etc.)
// This is completely optional - you can skip this if you don't need file uploads

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Upload alliance logo or other files to Supabase Storage
 * @param file - File buffer
 * @param fileName - File name with extension
 * @param bucket - Storage bucket name (e.g., 'alliance-logos')
 * @returns Public URL of uploaded file
 */
export async function uploadFile(
  file: Buffer,
  fileName: string,
  bucket: string = 'alliance-logos'
): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase not configured for file storage');
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error('File upload error:', error);
    return null;
  }
}

/**
 * Delete file from Supabase Storage
 * @param fileName - File name to delete
 * @param bucket - Storage bucket name
 */
export async function deleteFile(
  fileName: string,
  bucket: string = 'alliance-logos'
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    return !error;
  } catch (error) {
    console.error('File deletion error:', error);
    return false;
  }
}

export default supabase;