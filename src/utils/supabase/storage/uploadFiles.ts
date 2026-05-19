import { uploadFileClient } from '@/utils/supabase/storage/storage.client';

interface UploadFilesParams {
  files: File[];
  folder: string;
  bucket: string;
}

export const uploadFiles = async (props: UploadFilesParams) => {
  const { files, folder, bucket } = props;

  let uploadedUrls: string[] = [];

  // Subir archivos File si existen
  if (files.length > 0) {
    const uploadPromises = files.map(async (file, index) => {
      const fileExtension = file.name.split('.').pop();
      const fileName = `${index}.${fileExtension}`;
      const filePath = `${folder}/${fileName}`;
      const options = { upsert: true };
      const getSignedUrl = true;

      const params = { file, bucket, filePath, options, getSignedUrl };
      const { signedUrl } = await uploadFileClient(params);

      return signedUrl;
    });

    const newUploadedUrls = await Promise.all(uploadPromises);
    // Filtrar URLs nulas y asegurar que son strings
    uploadedUrls = newUploadedUrls.filter((url): url is string => url !== null);
  }

  return uploadedUrls;
}
