import { supabase } from "@/integrations/supabase/client";

export async function uploadPlantImage(
  file: File,
  userId: string
): Promise<{ url: string; path: string }> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("plant-images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("Failed to upload image");
  }

  const { data } = supabase.storage.from("plant-images").getPublicUrl(filePath);

  return {
    url: data.publicUrl,
    path: filePath,
  };
}

export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from("plant-images").remove([path]);

  if (error) {
    console.error("Delete error:", error);
    throw new Error("Failed to delete image");
  }
}