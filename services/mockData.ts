import { Artisan } from '../types';

export const ARTISANS: Artisan[] = [
  // Verified Builders
  {
    id: 'v1',
    name: 'Thabo Mokoena',
    category: 'Builders',
    location: 'Tsakane',
    phone: '071 234 5678',
    email: 'thabo.builds@eastrand.co.za',
    rating: 4.8,
    reviewCount: 45,
    bio: 'Quality home building and renovations in Tsakane and surrounding areas.',
    services: ['New Builds', 'Extensions', 'Bricklaying'],
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    reviews: [
      { id: 'r1', userName: 'Sipho Zulu', rating: 5, comment: 'Thabo built our boundary wall. Excellent craftsmanship and finished ahead of schedule.', date: '2023-11-12' },
      { id: 'r2', userName: 'Mary Sithole', rating: 4, comment: 'Great service, though there was a slight delay with materials. Overall very happy.', date: '2023-10-05' }
    ]
  },
  {
    id: 'v4',
    name: 'Dumisani Khumalo',
    category: 'Builders',
    location: 'Tsakane',
    phone: '072 555 1234',
    email: 'dumisani.k@tsakanebuild.co.za',
    rating: 4.9,
    reviewCount: 67,
    bio: 'Specialist in modern architectural builds and structural renovations within the Tsakane community.',
    services: ['Architectural Masonry', 'Luxury Renovations', 'Project Management'],
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    reviews: [
      { id: 'r3', userName: 'Lindiwe Ngwenya', rating: 5, comment: 'Best builder in the East Rand. His attention to detail is unmatched.', date: '2024-01-20' }
    ]
  },
  {
    id: 'v2',
    name: 'Musa Zulu',
    category: 'Builders',
    location: 'KwaThema',
    phone: '071 888 2222',
    email: 'musa.const@eastrand.co.za',
    rating: 4.7,
    reviewCount: 39,
    bio: 'Professional masonry and foundation work. Local KwaThema expert.',
    services: ['Foundations', 'Plastering', 'Paving'],
    imageUrl: 'https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    reviews: [
      { id: 'r4', userName: 'Jabu Buthelezi', rating: 5, comment: 'Top foundation work. Very professional.', date: '2023-08-15' }
    ]
  },
  {
    id: 'e1',
    name: 'Lerato Sithole',
    category: 'Electricians',
    location: 'Tsakane',
    phone: '083 666 9876',
    email: 'lerato.spark@tsakane.co.za',
    rating: 5.0,
    reviewCount: 28,
    bio: 'Fully certified master electrician. Specialist in home automation and fault-finding in Tsakane.',
    services: ['Electrical Maintenance', 'Solar Installations', 'DB Board Upgrades'],
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    reviews: [
      { id: 'r5', userName: 'Zanele Khoza', rating: 5, comment: 'Lerato installed our solar system. Professional and reliable.', date: '2024-02-10' }
    ]
  },
  {
    id: 'p3',
    name: 'Kabelo Seoka',
    category: 'Plumbers',
    location: 'Tsakane',
    phone: '065 777 2222',
    email: 'kabelo.p@tsakane.co.za',
    rating: 4.8,
    reviewCount: 41,
    bio: 'Reliable water solutions for Tsakane community.',
    services: ['Bathroom fitting', 'Drainage'],
    imageUrl: 'https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&q=80&w=400',
    isVerified: true,
    reviews: [
      { id: 'r6', userName: 'Bongani Nkosi', rating: 4, comment: 'Fixed a major leak. Good work.', date: '2023-12-01' }
    ]
  }
];

export const EAST_RAND_LOCATIONS = [
  'Tsakane',
  'KwaThema',
  'Kwate', // User variant
  'Nigel',
  'Maniger', // User variant
  'Springs',
  'Brakpan',
  'Duduza',
  'Selefield',
  'Sharon Park',
  'Geluksdal',
  'Langaville',
  'Alra Park',
  'Daveyton' // Added per request
];