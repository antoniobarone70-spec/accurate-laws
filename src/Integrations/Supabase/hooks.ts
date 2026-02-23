import { supabase } from './client';
import { DbProperty, DbScheduledItem, DbInventoryRoom } from './types';
import { PropertyData, ScheduledItem, InventoryRoom } from '@/types/property';

// Converti da formato DB a formato App
export function dbToAppProperty(db: DbProperty, scheduledItems: DbScheduledItem[], inventory: DbInventoryRoom[]): PropertyData {
  return {
    id: db.id,
    condominiumName: db.condominium_name,
    address: db.address,
    fiscalCode: db.fiscal_code,
    comuneName: db.comune_name,
    adminName: db.admin_name,
    adminPhone: db.admin_phone,
    adminMobile: db.admin_mobile,
    adminEmail: db.admin_email,
    adminPec: db.admin_pec,
    adminFiscalCode: db.admin_fiscal_code,
    adminVat: db.admin_vat,
    adminRea: db.admin_rea,
    adminAddress: db.admin_address,
    bankName: db.bank_name,
    bankIban: db.bank_iban,
    tenantName: db.tenant_name,
    rentalType: db.rental_type as any,
    startDate: db.start_date || '',
    endDate: db.end_date || '',
    monthlyRent: db.monthly_rent,
    condominiumFees: db.condominium_fees,
    cedolareSeccaYear: db.cedolare_secca_year as any,
    registrationNumber: db.registration_number,
    registrationDate: db.registration_date || '',
    depositoCauzionale: db.deposito_cauzionale,
    mainCategory: db.main_category,
    mainRendita: db.main_rendita,
    mainMq: db.main_mq,
    mainSezioneUrbana: db.main_sezione_urbana,
    mainFoglio: db.main_foglio,
    mainParticella: db.main_particella,
    mainSubalterno: db.main_subalterno,
    pertinenzaCategory: db.pertinenza_category,
    pertinenzaRendita: db.pertinenza_rendita,
    pertinenzaMq: db.pertinenza_mq,
    pertinenzaSezioneUrbana: db.pertinenza_sezione_urbana,
    pertinenzaFoglio: db.pertinenza_foglio,
    pertinenzaParticella: db.pertinenza_particella,
    pertinenzaSubalterno: db.pertinenza_subalterno,
    imuAliquota: db.imu_aliquota,
    contatoreGas: db.contatore_gas,
    contatoreLuce: db.contatore_luce,
    contatoreAcqua: db.contatore_acqua,
    scheduledItems: scheduledItems.map(item => ({
      id: item.id,
      title: item.title,
      date: item.date,
      type: item.type as any,
      completed: item.completed,
      notes: item.notes
    })),
    inventory: inventory.map(room => ({
      id: room.id,
      name: room.name,
      description: room.description
    }))
  };
}

// Converti da formato App a formato DB
export function appToDbProperty(app: PropertyData): Partial<DbProperty> {
  return {
    condominium_name: app.condominiumName,
    address: app.address,
    fiscal_code: app.fiscalCode,
    comune_name: app.comuneName,
    admin_name: app.adminName,
    admin_phone: app.adminPhone,
    admin_mobile: app.adminMobile,
    admin_email: app.adminEmail,
    admin_pec: app.adminPec,
    admin_fiscal_code: app.adminFiscalCode,
    admin_vat: app.adminVat,
    admin_rea: app.adminRea,
    admin_address: app.adminAddress,
    bank_name: app.bankName,
    bank_iban: app.bankIban,
    tenant_name: app.tenantName,
    rental_type: app.rentalType,
    start_date: app.startDate || null,
    end_date: app.endDate || null,
    monthly_rent: app.monthlyRent,
    condominium_fees: app.condominiumFees,
    cedolare_secca_year: app.cedolareSeccaYear,
    registration_number: app.registrationNumber,
    registration_date: app.registrationDate || null,
    deposito_cauzionale: app.depositoCauzionale,
    main_category: app.mainCategory,
    main_rendita: app.mainRendita,
    main_mq: app.mainMq,
    main_sezione_urbana: app.mainSezioneUrbana,
    main_foglio: app.mainFoglio,
    main_particella: app.mainParticella,
    main_subalterno: app.mainSubalterno,
    pertinenza_category: app.pertinenzaCategory,
    pertinenza_rendita: app.pertinenzaRendita,
    pertinenza_mq: app.pertinenzaMq,
    pertinenza_sezione_urbana: app.pertinenzaSezioneUrbana,
    pertinenza_foglio: app.pertinenzaFoglio,
    pertinenza_particella: app.pertinenzaParticella,
    pertinenza_subalterno: app.pertinenzaSubalterno,
    imu_aliquota: app.imuAliquota,
    contatore_gas: app.contatoreGas,
    contatore_luce: app.contatoreLuce,
    contatore_acqua: app.contatoreAcqua,
    updated_at: new Date().toISOString()
  };
}

// Funzioni API
export async function fetchProperty(): Promise<PropertyData | null> {
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('user_id', 'default')
    .single();

  if (error || !property) return null;

  const { data: scheduledItems } = await supabase
    .from('scheduled_items')
    .select('*')
    .eq('property_id', property.id);

  const { data: inventory } = await supabase
    .from('inventory_rooms')
    .select('*')
    .eq('property_id', property.id);

  return dbToAppProperty(property, scheduledItems || [], inventory || []);
}

export async function saveProperty(data: PropertyData): Promise<string | null> {
  const dbData = appToDbProperty(data);

  if (data.id) {
    // Update esistente
    const { error } = await supabase
      .from('properties')
      .update(dbData)
      .eq('id', data.id);

    if (error) {
      console.error('Error updating property:', error);
      return null;
    }
    return data.id;
  } else {
    // Insert nuovo
    const { data: newProperty, error } = await supabase
      .from('properties')
      .insert({ ...dbData, user_id: 'default' })
      .select()
      .single();

    if (error || !newProperty) {
      console.error('Error inserting property:', error);
      return null;
    }
    return newProperty.id;
  }
}

export async function addScheduledItemDb(propertyId: string, item: Omit<ScheduledItem, 'id'>): Promise<ScheduledItem | null> {
  const { data, error } = await supabase
    .from('scheduled_items')
    .insert({
      property_id: propertyId,
      title: item.title,
      date: item.date,
      type: item.type,
      completed: item.completed,
      notes: item.notes
    })
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    title: data.title,
    date: data.date,
    type: data.type as any,
    completed: data.completed,
    notes: data.notes
  };
}

export async function removeScheduledItemDb(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('scheduled_items')
    .delete()
    .eq('id', itemId);

  return !error;
}

export async function addInventoryRoomDb(propertyId: string, room: Omit<InventoryRoom, 'id'>): Promise<InventoryRoom | null> {
  const { data, error } = await supabase
    .from('inventory_rooms')
    .insert({
      property_id: propertyId,
      name: room.name,
      description: room.description
    })
    .select()
    .single();

  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    description: data.description
  };
}

export async function removeInventoryRoomDb(roomId: string): Promise<boolean> {
  const { error } = await supabase
    .from('inventory_rooms')
    .delete()
    .eq('id', roomId);

  return !error;
}