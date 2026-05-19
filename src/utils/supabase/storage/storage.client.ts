import { createClient } from '../supabase.client';

interface FileObject {
  name: string;
  content_type?: string;
  updated_at?: string;
}

interface DowloadFileClientParams {
  bucket: string;
  filePath: string;
  fileObject: FileObject;
}

interface UploadFileClientParams {
  file: File;
  filePath: string;
  bucket: string;
  options?: { upsert?: boolean };
  getSignedUrl?: boolean;
}

interface DeleteFileClientParams {
  bucket: string;
  filePath: string;
}

export const dowloadFileClient = async (params: DowloadFileClientParams) => {
  const supabase = createClient();
  const { filePath, bucket, fileObject } = params;

  const supabaseBlobToFile = (blob: Blob, fileObject: FileObject): File => {
    const filename = fileObject.name;
    const type = fileObject.content_type || blob.type || 'application/octet-stream';
    const lastModified = fileObject.updated_at
      ? new Date(fileObject.updated_at).getTime()
      : Date.now();

    const options = { type, lastModified }
    return new File([blob], filename, options);
  }

  const { data: blob, error } = await supabase
    .storage
    .from(bucket)
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download file ${fileObject.name}: ${error.message}`);
  }

  if (blob) {
    return supabaseBlobToFile(blob, fileObject);
  }

  return null;
}

export const uploadFileClient = async (params: UploadFileClientParams) => {
  const { file, bucket, options } = params;
  const { filePath, getSignedUrl = false } = params;

  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, options);

  if (error) {
    throw new Error(error.message);
  }

  let signedUrl = null;
  if (getSignedUrl && data) {
    const expiresIn = 99 * 365 * 24 * 60 * 60; // 99 years
    const { data: signedUrlData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn);

    if (signedUrlData) {
      signedUrl = signedUrlData.signedUrl;
    }
  }

  return { data, signedUrl };
};

export const deleteFileClient = async (params: DeleteFileClientParams) => {
  const { filePath, bucket } = params;

  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (error) {
    throw new Error(error.message);
  }

  return { data };
};
