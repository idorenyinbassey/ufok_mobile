// Mirrors config('ufok.amenities') / config('ufok.property_types') in the ufok backend.

export const AMENITY_OPTIONS = [
  { value: 'gym',              label: 'Gym' },
  { value: 'swimming_pool',    label: 'Swimming Pool' },
  { value: 'generator',        label: 'Generator' },
  { value: 'borehole',         label: 'Borehole' },
  { value: 'security',         label: 'Security' },
  { value: 'cctv',             label: 'CCTV' },
  { value: 'elevator',         label: 'Elevator' },
  { value: 'parking',          label: 'Parking' },
  { value: 'internet',         label: 'Internet' },
  { value: 'air_conditioning', label: 'Air Conditioning' },
  { value: 'serviced',         label: 'Serviced' },
  { value: 'garden',           label: 'Garden' },
  { value: 'balcony',          label: 'Balcony' },
  { value: 'servant_quarters', label: 'Servant Quarters' },
  { value: 'boys_quarters',    label: "Boy's Quarters" },
  { value: 'fence',            label: 'Fence' },
  { value: 'gate',             label: 'Gate' },
  { value: 'water_heater',     label: 'Water Heater' },
  { value: 'prepaid_meter',    label: 'Prepaid Meter' },
  { value: 'pop_ceiling',      label: 'POP Ceiling' },
] as const;

export const COMMISSION_RATES = [
  { value: '5', label: '5%' },
  { value: '10', label: '10%' },
  { value: '15', label: '15%' },
] as const;

const ALL_PRICE_PERIODS = [
  { value: 'monthly',  label: 'Monthly' },
  { value: 'yearly',   label: 'Yearly' },
  { value: 'weekly',   label: 'Weekly' },
  { value: 'daily',    label: 'Daily' },
  { value: 'outright', label: 'Outright' },
];

// Matches PropertyForm::updatedTransactionType() / the price_period <select> options on web.
export function pricePeriodOptionsFor(transactionType: string) {
  if (transactionType === 'sale') {
    return ALL_PRICE_PERIODS.filter(p => p.value === 'outright');
  }
  if (transactionType === 'shortlet') {
    return ALL_PRICE_PERIODS.filter(p => ['daily', 'weekly'].includes(p.value));
  }
  return ALL_PRICE_PERIODS.filter(p => ['monthly', 'yearly', 'weekly', 'daily'].includes(p.value));
}

export function defaultPricePeriodFor(transactionType: string): string {
  if (transactionType === 'sale') return 'outright';
  if (transactionType === 'shortlet') return 'daily';
  return 'monthly';
}
