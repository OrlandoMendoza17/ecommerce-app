import { createClient } from '../supabase.client'
import { dowloadFileClient } from './storage.client';

export const generateFolderPath = (club_id: string, entity_type: string, entity_id: string): string => {
  return `${club_id}/${entity_type}/${entity_id}`;
}

export const downloadFiles = async (folderPath: string, bucket: string) => {
  const supabase = createClient();

  // List all files in the folder
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .list(folderPath);

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  // Supabase puede devolver placeholders en carpetas vacías (ej. .emptyFolderPlaceholder); excluirlos
  const realFiles = (data || []).filter(
    (fileObject) =>
      fileObject.name != null &&
      !String(fileObject.name).toLowerCase().includes('emptyfolderplaceholder')
  );

  // Download each file and convert to File object
  const promises = realFiles.map(async (fileObject) => {
    const filePath = `${folderPath}/${fileObject.name}`;
    const file = await dowloadFileClient({ bucket, filePath, fileObject });
    return file;
  });

  const files = (await Promise.all(promises)).filter((file) => !!file);
  return files;
}
