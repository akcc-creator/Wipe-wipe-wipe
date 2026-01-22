
import { ALL_IMAGES } from '../constants';

export interface GenerationResult {
  url: string;
  source: 'LIBRARY';
}

/**
 * Gets a random image from the flattened curated list.
 * @param excludeUrl Optional URL to exclude (to avoid repeating the same image immediately)
 */
export const getRandomImage = async (excludeUrl?: string | null): Promise<GenerationResult> => {
  // Simulate a tiny network delay for better UX flow
  await new Promise(resolve => setTimeout(resolve, 600)); 

  let pool = ALL_IMAGES;

  // Simple filter to avoid immediate repeat if possible
  if (excludeUrl && pool.length > 1) {
    pool = pool.filter(url => url !== excludeUrl);
  }

  const randomUrl = pool[Math.floor(Math.random() * pool.length)];

  return {
    url: randomUrl,
    source: 'LIBRARY'
  };
};
