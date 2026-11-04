export interface ProductItem {
  id: string;
  nama: string;
  kategori: string;
  varianRasa: string;
  ukuranDefaultGram: number;
  hargaEceran: number;
  hargaReseller: number;
  minOrderGrosir: number;
  deskripsi: string;
  komposisi: string;
  alergen: string;
  masaSimpan: string;
  momen: string;
  statusStok: 'Tersedia' | 'Pre-Order' | 'Habis';
  defaultModalBatch?: number;
  defaultMinyakGas?: number;
  defaultPenyusutan?: number;
}

export interface BatchParameters {
  productId: string;
  productName: string;
  batchWeightGram: number;
  shrinkagePercent: number;
  rawMaterialCost: number;
  cookingCost: number;
  laborOverheadCost: number;
}

export interface PackagingCostConfig {
  sizeGram: number;
  label: string;
  pouchCost: number;
  stickerCost: number;
  extraCost: number;
  retailPrice: number;
}

export interface RepackResult {
  sizeGram: number;
  label: string;
  pcsProduced: number;
  rawMaterialHppPerPcs: number;
  packagingCostPerPcs: number;
  totalHppPerPcs: number;
  retailPrice: number;
  netProfitPerPcs: number;
  marginPercent: number;
  markupPercent: number;
  healthStatus: 'healthy' | 'warning' | 'danger';
}

export interface ResellerMarketplaceParams {
  selectedSizeGram: number;
  resellerDiscountPercent: number;
  resellerMoq: number;
  marketplaceAdminPercent: number;
  marketplaceFreeShippingPercent: number;
  marketplaceFixedFee: number;
  marketplacePackagingExtra: number;
}

export interface ChannelSimulationResult {
  channelName: string;
  sellingPricePerUnit: number;
  totalQuantity: number;
  grossRevenue: number;
  channelDeductionsTotal: number;
  channelDeductionPercent: number;
  totalHppCost: number;
  netProfitReceived: number;
  netMarginPercent: number;
  profitPerUnit: number;
  healthStatus: 'healthy' | 'warning' | 'danger';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
