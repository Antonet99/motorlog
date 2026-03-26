import { useEffect, useMemo, useState } from 'react';
import { Bike, CarFront } from 'lucide-react';
import { getBrandLogoUrl } from '../lib/logos';
import type { VehicleType } from '../types/domain';

interface BrandLogoProps {
  brand: string;
  vehicleType: VehicleType;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASS_NAMES: Record<NonNullable<BrandLogoProps['size']>, string> = {
  sm: 'h-8 w-8 rounded-xl',
  md: 'h-9 w-9 rounded-2xl',
  lg: 'h-11 w-11 rounded-2xl',
};

export function BrandLogo({ brand, vehicleType, size = 'md' }: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = useMemo(
    () => getBrandLogoUrl(brand, size === 'sm' ? 'thumb' : 'optimized'),
    [brand, size],
  );

  useEffect(() => {
    setHasError(false);
  }, [logoUrl]);

  const Icon = vehicleType === 'Moto' ? Bike : CarFront;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden border border-white/8 bg-slate-950/70 p-1.5 text-slate-300 ${SIZE_CLASS_NAMES[size]}`}
    >
      {logoUrl && !hasError ? (
        <img
          src={logoUrl}
          alt={`Logo ${brand}`}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setHasError(true)}
        />
      ) : (
        <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'} />
      )}
    </span>
  );
}
