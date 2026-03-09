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
  id: string;
  name: string;
  category: ArtisanCategory;
  location: string;
  phone: string;
  email?: string; 
  
    image_url: string; 
  
  // 👇 CHANGE THIS to match your Database Column Name
  isVerified: boolean; 
  is_claimed?: boolean;
  portfolio_urls?: string[];
  // ... other fields
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