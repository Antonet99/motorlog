const DATASET_BASE_URL =
  'https://raw.githubusercontent.com/filippofilip95/car-logos-dataset/master/logos';

const BRAND_SLUG_OVERRIDES: Record<string, string> = {
  'alfa romeo': 'alfa-romeo',
  'aston martin': 'aston-martin',
  'bmw motorrad': 'bmw',
  'ds automobiles': 'ds',
  'great wall': 'great-wall',
  'harley davidson': 'harley-davidson',
  'land rover': 'land-rover',
  'mercedes benz': 'mercedes-benz',
  'mercedes-benz': 'mercedes-benz',
  'mini cooper': 'mini',
  'moto guzzi': 'moto-guzzi',
  'mv agusta': 'mv-agusta',
  'royal enfield': 'royal-enfield',
  'rolls royce': 'rolls-royce',
};

function normalizeBrand(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugifyBrand(value: string) {
  return normalizeBrand(value).replace(/\s+/g, '-');
}

export function getBrandSlug(brand: string) {
  const normalizedBrand = normalizeBrand(brand);
  return BRAND_SLUG_OVERRIDES[normalizedBrand] ?? slugifyBrand(brand);
}

export function getBrandLogoUrl(brand: string, variant: 'thumb' | 'optimized' = 'optimized') {
  if (!brand.trim()) {
    return null;
  }

  return `${DATASET_BASE_URL}/${variant}/${getBrandSlug(brand)}.png`;
}
