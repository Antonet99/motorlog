export const VEHICLE_TYPES = ['Auto', 'Moto'] as const;

export const FUEL_TYPES = [
  'Benzina',
  'Diesel',
  'GPL',
  'Metano',
  'Ibrido benzina',
  'Ibrido diesel',
  'Elettrico',
] as const;

export const EXPENSE_CATEGORIES = [
  'Rata',
  'Assicurazione',
  'Bollo',
  'Revisione',
  'Tagliando',
  'Meccanico',
  'Pedaggio',
  'Multa',
  'Accessori',
  'Altro',
] as const;

export type VehicleType = (typeof VEHICLE_TYPES)[number];
export type FuelType = (typeof FUEL_TYPES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type AppTab = 'overview' | 'vehicles' | 'refuels' | 'expenses';
export type QuickAddType = 'vehicle' | 'refuel' | 'expense';

export interface Vehicle {
  id: string;
  uid: string;
  name: string;
  nickname: string | null;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  plate: string;
  year: number | null;
  color: string | null;
  tank_capacity_liters: number;
  fuel_type: FuelType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VehicleInput {
  uid: string;
  nickname: string | null;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  plate: string;
  year: number | null;
  color: string | null;
  tank_capacity_liters: number;
  fuel_type: FuelType;
  is_active: boolean;
}
