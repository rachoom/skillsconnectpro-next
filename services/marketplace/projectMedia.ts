import { getSupabaseAdmin } from '../supabaseAdmin';
import type { ProjectMedia } from '../../types/marketplace';

const BUCKET = 'project-media-private';
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type DecodedImage = {
  bytes: Buffer;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
};

function decodeImageData(value: string): DecodedImage | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const dataUrlMatch = trimmed.match(/^data:(image\\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i);
  const contentType = (dataUrlMatch?.[1] ?? 'image/jpeg').toLowerCase();
  const base64 = dataUrlMatch?.[2] ?? trimmed.replace(/^base64,/, '');

  if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
    throw new Error('The uploaded image is invalid.');
  }

  const bytes = Buffer.from(base64, 'base64');
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) {
    throw new Error('The uploaded image is too large.');
  }

  if (contentType === 'image/png') return { bytes, contentType: 'image/png', extension: 'png' };
  if (contentType === 'image/webp') return { bytes, contentType: 'image/webp', extension: 'webp' };
  return { bytes, contentType: 'image/jpeg', extension: 'jpg' };
}

export async function storeProjectImage(
  projectId: string,
  imageData: string,
  alt = 'Customer project reference image',
): Promise<ProjectMedia | null> {
  const decoded = decodeImageData(imageData);
  if (!decoded) return null;

  const path = `projects/${projectId}/${crypto.randomUUID()}.${decoded.extension}`;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage.from(BUCKET).upload(path, decoded.bytes, {
    contentType: decoded.contentType,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) throw new Error(`Unable to store project image: ${error.message}`);

  return {
    path,
    type: 'image',
    alt,
    createdAt: new Date().toISOString(),
  };
}

export async function createProjectMediaSignedUrls(
  media: ProjectMedia[],
  expiresIn = 60 * 60,
): Promise<ProjectMedia[]> {
  if (!media.length) return [];

  const supabase = getSupabaseAdmin();
  return Promise.all(
    media.map(async (item) => {
      if (!item.path) return item;
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(item.path, expiresIn);
      if (error || !data?.signedUrl) {
        console.error('Unable to create project media signed URL:', error?.message);
        return item;
      }
      return { ...item, url: data.signedUrl };
    }),
  );
}
