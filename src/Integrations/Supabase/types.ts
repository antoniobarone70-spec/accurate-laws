export interface DbProperty {
  id: string;
  user_id: string;
  condominium_name: string;
  address: string;
  fiscal_code: string;
  comune_name: string;
  admin_name: string;
  admin_phone: string;
  admin_mobile: string;
  admin_email: string;
  admin_pec: string;
  admin_fiscal_code: string;
  admin_vat: string;
  admin_rea: string;
  admin_address: string;
  bank_name: string;
  bank_iban: string;
  tenant_name: string;
  rental_type: string;
  start_date: string | null;
  end_date: string | null;
  monthly_rent: number;
  condominium_fees: number;
  cedolare_secca_year: string;
  registration_number: string;
  registration_date: string | null;
  deposito_cauzionale: string;
  main_category: string;
  main_rendita: number;
  main_mq: number;
  main_sezione_urbana: string;
  main_foglio: string;
  main_particella: string;
  main_subalterno: string;
  pertinenza_category: string;
  pertinenza_rendita: number;
  pertinenza_mq: number;
  pertinenza_sezione_urbana: string;
  pertinenza_foglio: string;
  pertinenza_particella: string;
  pertinenza_subalterno: string;
  imu_aliquota: number;
  contatore_gas: string;
  contatore_luce: string;
  contatore_acqua: string;
  created_at: string;
  updated_at: string;
}

export interface DbScheduledItem {
  id: string;
  property_id: string;
  title: string;
  date: string;
  type: string;
  completed: boolean;
  notes: string;
  created_at: string;
}

export interface DbInventoryRoom {
  id: string;
  property_id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface DbMonthlyRecord {
  id: string;
  property_id: string;
  month: string;
  year: number;
  rent_received: boolean;
  rent_amount: number;
  condominium_paid: boolean;
  condominium_amount: number;
  notes: string;
  created_at: string;
}