export type OpeningCategoryId = 'birthday' | 'wedding' | 'party' | 'other';

export type OpeningCategory = {
  id: OpeningCategoryId;
  label: string;
};

export type OpeningTheme = {
  id: string;
  category: OpeningCategoryId;
  label: string;
  videoUrl: string;
};

export const UNIVERSAL_OPENING_POSTER_URL =
  'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Gemini_Generated_Image_xoo4grxoo4grxoo4%20(1).png';

export const OPENING_CATEGORIES: OpeningCategory[] = [
  {
    id: 'birthday',
    label: 'Anniversaire'
  },
  {
    id: 'wedding',
    label: 'Mariage'
  },
  {
    id: 'party',
    label: 'Fêtes'
  },
  {
    id: 'other',
    label: 'Autres thèmes'
  }
];

export const OPENING_THEMES: OpeningTheme[] = [
  {
    id: 'wedding_just_married',
    category: 'wedding',
    label: 'Just Married',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/just%20Married.mp4'
  },
  {
    id: 'wedding_fusion',
    category: 'wedding',
    label: 'Fusion',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Alliance%20Fusion.mp4'
  },
  {
    id: 'wedding_ceremony',
    category: 'wedding',
    label: 'Cérémonie',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Allance%20couple.mp4'
  },
  {
    id: 'wedding_presentation',
    category: 'wedding',
    label: 'Présentation',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/aliance%20Presentaation.mp4'
  },
  {
    id: 'birthday_balloons',
    category: 'birthday',
    label: 'Ballons',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Aniv%20Ballons.mp4'
  },
  {
    id: 'birthday_glitter',
    category: 'birthday',
    label: 'Paillettes',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Aniv%20Paillettes.mp4'
  },
  {
    id: 'birthday_pink',
    category: 'birthday',
    label: 'Pink',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Anniv%20Pink.mp4'
  },
  {
    id: 'birthday_baby',
    category: 'birthday',
    label: 'Bébé',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Anniv%20baby.mp4'
  },
  {
    id: 'party_disco',
    category: 'party',
    label: 'Disco',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Disco.mp4'
  },
  {
    id: 'party_dance',
    category: 'party',
    label: 'Danse',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Grou.mp4'
  },
  {
    id: 'party_monkey',
    category: 'party',
    label: 'Monkey',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Monkey.mp4'
  },
  {
    id: 'party_together',
    category: 'party',
    label: 'Together',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Together.mp4'
  },
  {
    id: 'other_love_flowers',
    category: 'other',
    label: 'Love Fleurs',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Lov%20Flower.mp4'
  },
  {
    id: 'other_spiritual',
    category: 'other',
    label: 'Spirituel',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Sprituel.mp4'
  },
  {
    id: 'other_new_year',
    category: 'other',
    label: 'Nouvel An',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Nouvel%20an.mp4'
  },
  {
    id: 'other_memorial',
    category: 'other',
    label: 'Hommage',
    videoUrl: 'https://njvnmribopknrqvtjkup.supabase.co/storage/v1/object/public/invitations/Bougie.mp4'
  }
];

export const DEFAULT_THEME_BY_CATEGORY: Record<OpeningCategoryId, string> = {
  birthday: 'birthday_pink',
  wedding: 'wedding_just_married',
  party: 'party_disco',
  other: 'other_love_flowers'
};

export const DEFAULT_CATEGORY_BY_EVENT: Record<string, OpeningCategoryId> = {
  wedding: 'wedding',
  birthday: 'birthday',
  party: 'party',
  baptism: 'other',
  babyshower: 'other',
  funeral: 'other',
  default: 'other'
};

export const DEFAULT_THEME_BY_EVENT: Record<string, string> = {
  wedding: 'wedding_just_married',
  birthday: 'birthday_pink',
  party: 'party_disco',
  baptism: 'other_spiritual',
  babyshower: 'birthday_baby',
  funeral: 'other_memorial',
  default: 'other_love_flowers'
};

export const getOpeningThemeById = (themeId?: string | null) => {
  if (!themeId) return undefined;

  return OPENING_THEMES.find((theme) => theme.id === themeId);
};

export const getOpeningThemesByCategory = (categoryId?: string | null) => {
  return OPENING_THEMES.filter((theme) => theme.category === categoryId);
};

export const getDefaultOpeningThemeForEvent = (eventType?: string | null) => {
  const themeId = DEFAULT_THEME_BY_EVENT[eventType || 'default'] || DEFAULT_THEME_BY_EVENT.default;

  return getOpeningThemeById(themeId) || OPENING_THEMES[0];
};

export const getDefaultOpeningThemeForCategory = (categoryId?: string | null) => {
  const safeCategory = (categoryId || 'other') as OpeningCategoryId;
  const themeId = DEFAULT_THEME_BY_CATEGORY[safeCategory] || DEFAULT_THEME_BY_CATEGORY.other;

  return getOpeningThemeById(themeId) || OPENING_THEMES[0];
};
