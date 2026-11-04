import {
  BatchParameters,
  PackagingCostConfig,
  RepackResult,
  ResellerMarketplaceParams,
  ChannelSimulationResult,
} from '../types/snacks';

export function formatRupiah(value: number): string {
  if (isNaN(value)) return 'Rp\u00A00';
  return 'Rp\u00A0' + Math.round(value).toLocaleString('id-ID');
}

export function formatGram(gram: number): string {
  if (gram >= 1000) {
    const kg = gram / 1000;
    return `${kg % 1 === 0 ? kg : kg.toFixed(1)} Kg`;
  }
  return `${gram.toLocaleString('id-ID')} g`;
}

export function formatPercent(value: number): string {
  if (isNaN(value) || !isFinite(value)) return '0.0%';
  return `${value.toFixed(1)}%`;
}

export function getHealthStatus(marginPercent: number): 'healthy' | 'warning' | 'danger' {
  if (marginPercent >= 30) return 'healthy';
  if (marginPercent >= 15) return 'warning';
  return 'danger';
}

export function calculateRepackMatrix(
  batch: BatchParameters,
  packagingConfigs: PackagingCostConfig[]
): {
  netYieldGram: number;
  totalBatchCost: number;
  costPerGram: number;
  rows: RepackResult[];
} {
  const shrinkFactor = Math.max(0, 1 - (batch.shrinkagePercent || 0) / 100);
  const netYieldGram = Math.max(0, (batch.batchWeightGram || 0) * shrinkFactor);
  
  const totalBatchCost =
    (batch.rawMaterialCost || 0) +
    (batch.cookingCost || 0) +
    (batch.laborOverheadCost || 0);

  const costPerGram = netYieldGram > 0 ? totalBatchCost / netYieldGram : 0;

  const rows: RepackResult[] = packagingConfigs.map((cfg) => {
    const pcsProduced = cfg.sizeGram > 0 ? Math.floor(netYieldGram / cfg.sizeGram) : 0;
    const rawMaterialHppPerPcs = cfg.sizeGram * costPerGram;
    const packagingCostPerPcs = (cfg.pouchCost || 0) + (cfg.stickerCost || 0) + (cfg.extraCost || 0);
    const totalHppPerPcs = rawMaterialHppPerPcs + packagingCostPerPcs;
    const retailPrice = cfg.retailPrice || 0;
    const netProfitPerPcs = retailPrice - totalHppPerPcs;
    const marginPercent = retailPrice > 0 ? (netProfitPerPcs / retailPrice) * 100 : 0;
    const markupPercent = totalHppPerPcs > 0 ? (netProfitPerPcs / totalHppPerPcs) * 100 : 0;

    return {
      sizeGram: cfg.sizeGram,
      label: cfg.label || `${cfg.sizeGram}g`,
      pcsProduced,
      rawMaterialHppPerPcs: Math.round(rawMaterialHppPerPcs),
      packagingCostPerPcs: Math.round(packagingCostPerPcs),
      totalHppPerPcs: Math.round(totalHppPerPcs),
      retailPrice: Math.round(retailPrice),
      netProfitPerPcs: Math.round(netProfitPerPcs),
      marginPercent: Number(marginPercent.toFixed(1)),
      markupPercent: Number(markupPercent.toFixed(1)),
      healthStatus: getHealthStatus(marginPercent),
    };
  });

  return {
    netYieldGram: Math.round(netYieldGram),
    totalBatchCost: Math.round(totalBatchCost),
    costPerGram: Number(costPerGram.toFixed(2)),
    rows,
  };
}

export function calculateChannelSimulations(
  repackRow: RepackResult,
  params: ResellerMarketplaceParams
): ChannelSimulationResult[] {
  const retailPrice = repackRow.retailPrice;
  const unitHpp = repackRow.totalHppPerPcs;

  // 1. Direct Sales (WhatsApp / Offline Store / COD)
  // Potongan: 0%, Qty: 1 pcs basis
  const directGross = retailPrice;
  const directDeductions = 0;
  const directNetProfit = directGross - unitHpp;
  const directMargin = directGross > 0 ? (directNetProfit / directGross) * 100 : 0;

  const directChannel: ChannelSimulationResult = {
    channelName: 'Jualan Langsung (WhatsApp / Toko Offline)',
    sellingPricePerUnit: retailPrice,
    totalQuantity: 1,
    grossRevenue: directGross,
    channelDeductionsTotal: 0,
    channelDeductionPercent: 0,
    totalHppCost: unitHpp,
    netProfitReceived: directNetProfit,
    netMarginPercent: Number(directMargin.toFixed(1)),
    profitPerUnit: directNetProfit,
    healthStatus: getHealthStatus(directMargin),
  };

  // 2. Reseller / Grosir (Toko Oleh-Oleh)
  // Selling price discounted by resellerDiscountPercent
  const resellerDiscountRate = params.resellerDiscountPercent / 100;
  const resellerPricePerUnit = Math.round(retailPrice * (1 - resellerDiscountRate));
  const resellerQty = params.resellerMoq;
  const resellerGross = resellerPricePerUnit * resellerQty;
  const resellerRetailEquivalentGross = retailPrice * resellerQty;
  const resellerTotalDiscount = resellerRetailEquivalentGross - resellerGross;
  const resellerTotalHpp = unitHpp * resellerQty;
  const resellerTotalProfit = resellerGross - resellerTotalHpp;
  const resellerProfitPerUnit = resellerPricePerUnit - unitHpp;
  const resellerMargin = resellerGross > 0 ? (resellerTotalProfit / resellerGross) * 100 : 0;

  const resellerChannel: ChannelSimulationResult = {
    channelName: `Grosir Reseller / Toko Mitra (MOQ ${resellerQty} pcs)`,
    sellingPricePerUnit: resellerPricePerUnit,
    totalQuantity: resellerQty,
    grossRevenue: resellerGross,
    channelDeductionsTotal: resellerTotalDiscount,
    channelDeductionPercent: params.resellerDiscountPercent,
    totalHppCost: resellerTotalHpp,
    netProfitReceived: resellerTotalProfit,
    netMarginPercent: Number(resellerMargin.toFixed(1)),
    profitPerUnit: resellerProfitPerUnit,
    healthStatus: getHealthStatus(resellerMargin),
  };

  // 3. Marketplace Online (Shopee / Tokopedia / TikTok Shop / GoFood)
  // Admin fee %, Free shipping extra %, Fixed transaction fee, Extra packing (bubble wrap/box)
  const totalMarketplacePercent =
    params.marketplaceAdminPercent + params.marketplaceFreeShippingPercent;
  const percentDeduction = Math.round(retailPrice * (totalMarketplacePercent / 100));
  const fixedDeduction = params.marketplaceFixedFee;
  const extraPackaging = params.marketplacePackagingExtra;
  const totalMarketplaceDeductions = percentDeduction + fixedDeduction + extraPackaging;
  
  const marketplaceNetReceived = retailPrice - percentDeduction - fixedDeduction;
  const marketplaceNetProfit = marketplaceNetReceived - unitHpp - extraPackaging;
  const marketplaceMargin = retailPrice > 0 ? (marketplaceNetProfit / retailPrice) * 100 : 0;
  const actualDeductionPercent = retailPrice > 0 ? (totalMarketplaceDeductions / retailPrice) * 100 : 0;

  const marketplaceChannel: ChannelSimulationResult = {
    channelName: 'Marketplace Online (Shopee / Tokped / TikTok Shop)',
    sellingPricePerUnit: retailPrice,
    totalQuantity: 1,
    grossRevenue: retailPrice,
    channelDeductionsTotal: totalMarketplaceDeductions,
    channelDeductionPercent: Number(actualDeductionPercent.toFixed(1)),
    totalHppCost: unitHpp,
    netProfitReceived: marketplaceNetProfit,
    netMarginPercent: Number(marketplaceMargin.toFixed(1)),
    profitPerUnit: marketplaceNetProfit,
    healthStatus: getHealthStatus(marketplaceMargin),
  };

  return [directChannel, resellerChannel, marketplaceChannel];
}

export function calculateIdealMarketplacePrice(
  unitHpp: number,
  targetMarginPercent: number,
  totalDeductionPercent: number,
  fixedDeductions: number
): number {
  // SellingPrice * (1 - totalDeductionPercent/100 - targetMarginPercent/100) = unitHpp + fixedDeductions
  const denominator = 1 - (totalDeductionPercent + targetMarginPercent) / 100;
  if (denominator <= 0) return 0;
  const rawPrice = (unitHpp + fixedDeductions) / denominator;
  // Round to nearest Rp 500
  return Math.ceil(rawPrice / 500) * 500;
}
