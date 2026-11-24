/** Bound both axes without upscaling, preserving the original aspect ratio. */
export function intakePhotoDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new Error('Unable to determine the image dimensions.');
  }
  const scale = Math.min(1, 720 / width, 1200 / height);
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}
