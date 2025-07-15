// src/lib/uploadAudio.ts

import { supabase } from "./supabaseClient";

export async function uploadAudio(file: File) {
  try {
    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log("Starting upload process...");

    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload to storage
    const { data, error } = await supabase.storage.from("recordings").upload(fileName, file);

    if (error) {
      throw new Error(`Failed to upload: ${error.message}`);
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("recordings").getPublicUrl(fileName);

    // Save metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from("recordings")
      .insert({
        user_id: user.id,
        file_name: fileName,
        original_name: file.name,
        file_url: publicUrlData.publicUrl,
        file_size: file.size,
        file_type: file.type,
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, clean up the uploaded file
      await supabase.storage.from("recordings").remove([fileName]);
      throw new Error(`Failed to save record: ${dbError.message}`);
    }

    console.log("Upload and database save successful:", dbData);

    return {
      fileUrl: publicUrlData.publicUrl,
      fileName,
      originalName: file.name,
      size: file.size,
      type: file.type,
      id: dbData.id,
    };
  } catch (error) {
    console.error("Upload function error:", error);
    throw error;
  }
}

// Generic file upload function (alias for uploadAudio for backward compatibility)
export const uploadFile = uploadAudio;
