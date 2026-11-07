// Frontend utilities and fallback defaults (all transactions, budget categories, and limits load dynamically from the backend)

export const DEFAULT_USER = {
  username: 'abdulshamil',
};

export const DEFAULT_AVAILABLE_CATEGORIES = [
  { name: 'Food', icon: 'Utensils', color: '#c9b27c' },
  { name: 'Rent', icon: 'Home', color: '#8fb39a' },
  { name: 'Travel', icon: 'Navigation', color: '#c9b27c' },
  { name: 'Bills', icon: 'Receipt', color: '#d4a359' },
  { name: 'Shopping', icon: 'ShoppingBag', color: '#8a8a93' },
  { name: 'Health', icon: 'HeartPulse', color: '#8fb39a' },
];

export const AVAILABLE_CATEGORIES = DEFAULT_AVAILABLE_CATEGORIES;

export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN');
};

export const PREDEFINED_PROFILE_PICTURES = [
  {
    id: 'profile1',
    label: 'Profile 1',
    image: '/profile1.jpg',
  },
  {
    id: 'profile2',
    label: 'Profile 2',
    image: '/profile2.jpg',
  },
];

export const getProfileImageUrl = (imageKey) => {
  if (imageKey === 'profile2' || imageKey === '/profile2.jpg') {
    return '/profile2.jpg';
  }
  return '/profile1.jpg';
};

export const normalizeProfileImageKey = (imageKey) => {
  if (imageKey === 'profile2' || imageKey === '/profile2.jpg') {
    return 'profile2';
  }
  return 'profile1';
};
