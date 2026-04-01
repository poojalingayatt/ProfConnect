import axios from 'axios';
import { api } from '@/lib/api';

type UploadSignatureResponse = {
  signature: string;
  timestamp: number;
  folder: string;
  access_mode: string;
  cloud_name: string;
  api_key: string;
  mediaType: string;
  uploadResourceType: 'auto' | 'raw';
};

type CloudinaryUploadResponse = {
  secure_url: string;
  resource_type: string;
  format?: string;
};

type SignedMediaUrlResponse = {
  signedUrl: string;
  expiresAt: number;
};

const SIGNATURE_TIMEOUT_MS = 10000;
const UPLOAD_TIMEOUT_MS = 60000; // 60s for file uploads

export const getUploadSignature = async (mimetype?: string): Promise<UploadSignatureResponse> => {
  try {
    console.log('[media-upload] requesting signature');
    const params = mimetype ? { mimetype } : {};
    const response = await api.get('/upload/signature', {
      params,
      timeout: SIGNATURE_TIMEOUT_MS,
    });
    console.log('[media-upload] signature response', response.data);
    return response.data;
  } catch (error) {
    console.error('[media-upload] signature request failed', error);
    throw error;
  }
};

export const uploadFileToCloudinary = async (
  file: File,
  signature: UploadSignatureResponse
): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', signature.api_key);
  formData.append('timestamp', String(signature.timestamp));
  formData.append('signature', signature.signature);
  formData.append('folder', signature.folder);
  formData.append('access_mode', signature.access_mode); // Make file publicly accessible
  formData.append('resource_type', 'auto');
  if (signature.uploadResourceType === 'raw') {
    formData.set('resource_type', 'raw');
  }

  console.log('[media-upload] starting Cloudinary upload', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    cloudName: signature.cloud_name,
    folder: signature.folder,
    accessMode: signature.access_mode,
    uploadResourceType: signature.uploadResourceType,
  });

  try {
    const response = await axios.post<CloudinaryUploadResponse>(
      `https://api.cloudinary.com/v1_1/${signature.cloud_name}/${signature.uploadResourceType}/upload`,
      formData,
      {
        timeout: UPLOAD_TIMEOUT_MS,
      }
    );

    console.log('[media-upload] Cloudinary upload success', {
      secure_url: response.data.secure_url,
      resource_type: response.data.resource_type,
      format: response.data.format ?? null,
      fullResponse: response.data,
    });

    return response.data;
  } catch (error) {
    console.error('[media-upload] Cloudinary upload failed', error);
    throw error;
  }
};

export const getSignedMediaUrl = async (mediaUrl: string): Promise<string> => {
  const response = await api.get<SignedMediaUrlResponse>('/upload/signed-url', {
    params: { mediaUrl },
    timeout: SIGNATURE_TIMEOUT_MS,
  });
  return response.data.signedUrl;
};
