import { createClient } from "../supabase.client";

export const deleteFileFromStorage = async (folder: string, bucket: string) => {
  const supabase = createClient();

  // List all files in the folder
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .list(folder);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  const fileNames = data.map((file) => `${folder}/${file.name}`);

  const anyFilesToDelete = fileNames.length > 0

  if (anyFilesToDelete) {
    const deleteQuery = await supabase.storage
      .from(bucket)
      .remove(fileNames);

    if (deleteQuery.error) {
      throw new Error(`Failed to delete files: ${deleteQuery.error.message}`);
    }
  }
}