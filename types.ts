export type ArtisanCategory = 
  | 'Builders' 
  | 'Plumbers' 
  | 'Electricians' 
  | 'Cleaners' 
  | 'Landscapers' 
  | 'Mechanics' 
  | 'Hairdressers' 
  | 'Dressmakers'
  | 'Tailors'
  | 'Painters'    // 👈 Added
  | 'Carpenters'; // 👈 Added

export interface Review {
  id: string;
  user_name: string; // Matched to likely DB column
  rating: number;
  comment: string;
  created_at: string;
}

export interface Artisan {
  id: string | number;
  name: string;
  category: string;
  location: string;
  phone: string;
  email?: string;
  verified?: boolean;
  isVerified?: boolean;
  rating?: number;
  bio?: string;
  image_url?: string;
  portfolio_images?: string[];
  portfolio_urls?: string[] | string;
  portfolio?: string[] | string;
  proof_of_work?: string[];
  website?: string | null;
  services?: string[];
  reviews?: any[];
  first_name?: string;
  last_name?: string;
}

export enum AppState {
  WELCOME = 'WELCOME',
  HOME = 'HOME',
  SEARCH_RESULTS = 'SEARCH_RESULTS',
  PROFILE = 'PROFILE',
  REGISTRATION = 'REGISTRATION',
  QUICK_JOIN = 'QUICK_JOIN', // 👈 ADD THIS LINE
  ADMIN = 'ADMIN' // 👈 This was missing!
}

// Keep the ViralClip interface for your future video features
export interface ViralClip {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  viralityScore: number;
  reasoning: string;
  suggestedCaption: string;
  musicUrl?: string;
  musicMood?: string;
}