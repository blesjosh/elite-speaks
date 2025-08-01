// src/lib/uploadAudio.ts

import { supabase } from "./supabaseClient";

/**
 * Uploads a file to Supabase Storage.
 * @param file - The file or blob to upload.
 * @param userId - The ID of the user uploading the file.
 * @returns The public URL of the uploaded file.
 */
export async function uploadAudio(file: Blob, userId: string): Promise<{ publicUrl: string; error: string | null }> {
  try {
    if (!userId) {
      return { publicUrl: '', error: "User not authenticated" };
    }

    console.log("Starting upload process...");

    // Generate a unique filename. Use a generic extension if the blob is not a file.
    const fileExt = (file instanceof File) ? file.name.split(".").pop() : 'webm';
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to storage
    const { data, error } = await supabase.storage.from("recordings").upload(fileName, file);

    if (error) {
      return { publicUrl: '', error: `Failed to upload: ${error.message}` };
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("recordings").getPublicUrl(fileName);

    if (!publicUrlData.publicUrl) {
        return { publicUrl: '', error: 'Could not get public URL for the uploaded file.' };
    }

    console.log("Upload successful, public URL:", publicUrlData.publicUrl);

    return { publicUrl: publicUrlData.publicUrl, error: null };
  } catch (err: any) {
    console.error("Upload function error:", err);
    return { publicUrl: '', error: err.message || "An unknown error occurred during upload." };
  }
}

// Generic file upload function (alias for uploadAudio for backward compatibility)
export const uploadFile = uploadAudio;
