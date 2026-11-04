import React, { useState } from 'react';
import {
  RepackResult,
  ResellerMarketplaceParams,
} from '../types/snacks';
import {
  formatRupiah,
  formatPercent,
  calculateChannelSimulations,
  calculateIdealMarketplacePrice,
} from '../utils/calculator';
import {
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react';

interface TabMarketplaceSimulatorProps {
  repackRows: RepackResult[];
  productName: string;
  resellerParams: ResellerMarketplaceParams;
  setResellerParams: React.Dispatch<React.SetStateAction<ResellerMarketplaceParams>>;
  onUpdateRetailPrice: (sizeGram: number, newPrice: number) => void;
}

export const TabMarketplaceSimulator: React.FC<TabMarketplaceSimulatorProps> = ({
  repackRows,
  productName,
  resellerParams,
  setResellerParams,
  onUpdateRetailPrice,
}) => {
  const [targetSafeMargin, setTargetSafeMargin] = useState<number>(25);

  // Find the selected repack row (fallback to first or 250g)
  const activeRow =
    repackRows.find((r) => r.sizeGram === resellerParams.selectedSizeGram) ||
    repackRows.find((r) => r.sizeGram === 250) ||
    repackRows[0];

  if (!activeRow) {
    return (
      <div className="bg-white border border-stone-200 rounded-lg p-8 text-center text-stone-500">
        Belum ada data ukuran kemasan untuk disimulasikan. Silakan isi parameter di Tab 1.
      </div>
    );
  }

  // Calculate channel comparison
  const channels = calculateChannelSimulations(activeRow, resellerParams);
  const directChannel = channels[0];
  const resellerChannel = channels[1];
  const marketplaceChannel = channels[2];

  // Total marketplace deduction percent
  const totalMarketplacePercent =
    resellerParams.marketplaceAdminPercent + resellerParams.marketplaceFreeShippingPercent;
  const fixedMarketplaceFees =
    resellerParams.marketplaceFixedFee + resellerParams.marketplacePackagingExtra;

  // Ideal marketplace price calculation
  const recommendedMarketplacePrice = calculateIdealMarketplacePrice(
    activeRow.totalHppPerPcs,
    targetSafeMargin,
    totalMarketplacePercent,
    fixedMarketplaceFees
  );

  const isMarketplaceDanger = marketplaceChannel.netMarginPercent < 15;

  // Calculations for Horizontal Bar Charts
  const retailPrice = activeRow.retailPrice;

  // Channel 1: Langsung
  const directHppWidth = Math.min(100, (activeRow.totalHppPerPcs / retailPrice) * 100);
  const directProfitWidth = Math.max(0, 100 - directHppWidth);

  // Channel 2: Reseller
  const resellerHppWidth = Math.min(100, (activeRow.totalHppPerPcs / retailPrice) * 100);
  const resellerDiscountWidth = Math.min(100 - resellerHppWidth, resellerParams.resellerDiscountPercent);
  const resellerProfitWidth = Math.max(0, 100 - resellerHppWidth - resellerDiscountWidth);

  // Channel 3: Marketplace
  const marketplaceTotalCost = activeRow.totalHppPerPcs + marketplaceChannel.channelDeductionsTotal;
  const isMarketplaceLoss = marketplaceChannel.profitPerUnit < 0;

  // If in profit: percentage of retail price
  // If in loss: percentage of total cost so it fits 100% perfectly with clear loss indication
  const mktBase = isMarketplaceLoss ? marketplaceTotalCost : retailPrice;
  const mktHppWidth = (activeRow.totalHppPerPcs / mktBase) * 100;
  const mktDeductionsWidth = (marketplaceChannel.channelDeductionsTotal / mktBase) * 100;
  const mktProfitWidth = isMarketplaceLoss ? 0 : Math.max(0, 100 - mktHppWidth - mktDeductionsWidth);

  return (
    <div className="space-y-5">
      {/* Product & Size Header Selector */}
      <div className="bg-white border border-stone-200 rounded-lg p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-stone-900">
                {productName}
              </span>
              <span className="text-xs text-stone-500 font-mono">
                • {activeRow.label}
              </span>
            </div>
            <p className="text-xs text-stone-500 font-mono mt-0.5">
              HPP: {formatRupiah(activeRow.totalHppPerPcs)} | Harga Ecer: {formatRupiah(activeRow.retailPrice)}
            </p>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-stone-500 shrink-0">Ukuran:</span>
            <div className="flex bg-stone-100 border border-stone-200 rounded-md p-0.5">
              {repackRows.map((r) => (
                <button
                  key={r.sizeGram}
                  type="button"
                  onClick={() =>
                    setResellerParams((prev) => ({ ...prev, selectedSizeGram: r.sizeGram }))
                  }
                  className={`px-2.5 py-1 text-xs font-mono font-medium rounded transition-colors duration-150 ${
                    r.sizeGram === activeRow.sizeGram
                      ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ALERT BOX: Marketplace Margin Warning */}
      {isMarketplaceDanger && (
        <div className="p-3 sm:p-3.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-900">
          <div className="flex items-start justify-between gap-3 flex-col sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" strokeWidth={1.5} />
              <span>
                Margin Marketplace tipis ({marketplaceChannel.netMarginPercent}%), sisa untung {formatRupiah(marketplaceChannel.profitPerUnit)}/pcs.
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs shrink-0 w-full sm:w-auto justify-end">
              <span>Rekomendasi: <strong className="font-mono">{formatRupiah(recommendedMarketplacePrice)}</strong></span>
              <button
                type="button"
                onClick={() =>
                  onUpdateRetailPrice(activeRow.sizeGram, recommendedMarketplacePrice)
                }
                className="px-2.5 py-1 text-xs font-medium rounded bg-rose-700 text-white hover:bg-rose-800 transition-colors duration-150"
              >
                Gunakan Harga Ini
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid: Sliders (Left) vs Comparison (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL: Sliders without unnecessary icons */}
        <div className="lg:col-span-5 space-y-5">
          {/* Channel 2: Reseller Controls */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-5 space-y-3.5">
            <div className="pb-2 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">
                1. Aturan Reseller & Grosir
              </h3>
            </div>

            {/* Reseller Discount */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-medium text-stone-700">
                  Diskon Reseller (%)
                </label>
                <span className="font-mono font-semibold text-stone-900">
                  {resellerParams.resellerDiscountPercent}% ({formatRupiah(resellerChannel.sellingPricePerUnit)})
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={35}
                step={1}
                value={resellerParams.resellerDiscountPercent}
                onChange={(e) =>
                  setResellerParams((prev) => ({
                    ...prev,
                    resellerDiscountPercent: Number(e.target.value),
                  }))
                }
                className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded cursor-pointer"
              />
            </div>

            {/* Reseller MOQ */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-medium text-stone-700">
                  Minimal Beli (MOQ)
                </label>
                <span className="font-mono font-semibold text-stone-900">
                  {resellerParams.resellerMoq} pcs
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={resellerParams.resellerMoq}
                onChange={(e) =>
                  setResellerParams((prev) => ({
                    ...prev,
                    resellerMoq: Number(e.target.value),
                  }))
                }
                className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded cursor-pointer"
              />
              <span className="text-[11px] text-stone-500 font-mono block mt-1">
                Omzet: {formatRupiah(resellerChannel.grossRevenue)} • Laba: {formatRupiah(resellerChannel.netProfitReceived)}
              </span>
            </div>
          </div>

          {/* Channel 3: Marketplace Controls */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-5 space-y-3.5">
            <div className="pb-2 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">
                2. Biaya Marketplace
              </h3>
            </div>

            {/* Admin Fee Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-medium text-stone-700">
                  Biaya Komisi / Admin (%)
                </label>
                <span className="font-mono font-semibold text-stone-900">
                  {resellerParams.marketplaceAdminPercent}%
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={16}
                step={0.5}
                value={resellerParams.marketplaceAdminPercent}
                onChange={(e) =>
                  setResellerParams((prev) => ({
                    ...prev,
                    marketplaceAdminPercent: Number(e.target.value),
                  }))
                }
                className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded cursor-pointer"
              />
            </div>

            {/* Free Shipping Program Slider */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <label className="font-medium text-stone-700">
                  Biaya Gratis Ongkir (%)
                </label>
                <span className="font-mono font-semibold text-stone-900">
                  {resellerParams.marketplaceFreeShippingPercent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={resellerParams.marketplaceFreeShippingPercent}
                onChange={(e) =>
                  setResellerParams((prev) => ({
                    ...prev,
                    marketplaceFreeShippingPercent: Number(e.target.value),
                  }))
                }
                className="w-full accent-stone-900 h-1.5 bg-stone-200 rounded cursor-pointer"
              />
            </div>

            {/* Fixed Fees per Transaction */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Biaya Transaksi (Rp)
                </label>
                <input
                  type="number"
                  value={resellerParams.marketplaceFixedFee}
                  onChange={(e) =>
                    setResellerParams((prev) => ({
                      ...prev,
                      marketplaceFixedFee: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs font-mono tabular-nums border border-stone-200 rounded bg-stone-50"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Packing Tambahan (Rp)
                </label>
                <input
                  type="number"
                  value={resellerParams.marketplacePackagingExtra}
                  onChange={(e) =>
                    setResellerParams((prev) => ({
                      ...prev,
                      marketplacePackagingExtra: Number(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-2.5 py-1 text-xs font-mono tabular-nums border border-stone-200 rounded bg-stone-50"
                  placeholder="1500"
                />
              </div>
            </div>

            <div className="p-2.5 bg-stone-50 border border-stone-200 rounded text-xs font-mono text-stone-600 flex justify-between">
              <span>Komisi: {totalMarketplacePercent.toFixed(1)}%</span>
              <span>Biaya Tetap: {formatRupiah(fixedMarketplaceFees)}</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Horizontal Bar Comparison & Side-by-Side Channels */}
        <div className="lg:col-span-7 space-y-5">
          {/* Horizontal Stacked Bars - Fixed Overflow and Truncation */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-5">
            <h3 className="text-sm font-semibold text-stone-900 pb-2 mb-3 border-b border-stone-100">
              Visualisasi Biaya & Laba (Basis 1 Pcs)
            </h3>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs mb-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-xs bg-stone-400" />
                <span className="text-stone-600">HPP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-xs bg-amber-400" />
                <span className="text-stone-600">Potongan / Diskon</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-xs bg-emerald-600" />
                <span className="text-stone-600">Laba Bersih</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-xs bg-rose-600" />
                <span className="text-stone-600">Defisit / Rugi</span>
              </div>
            </div>

            {/* 3 Channels Horizontal Bars (No decorative icons, robust widths) */}
            <div className="space-y-4">
              {/* Channel 1: WhatsApp / Direct */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-900">
                    Langsung (WhatsApp / Offline)
                  </span>
                  <span className="font-mono font-semibold text-emerald-700">
                    Laba: {formatRupiah(directChannel.profitPerUnit)} ({directChannel.netMarginPercent}%)
                  </span>
                </div>
                <div className="h-6 w-full bg-stone-100 rounded overflow-hidden flex border border-stone-200 font-mono text-[10px]">
                  <div
                    style={{ width: `${directHppWidth}%` }}
                    className="bg-stone-400 h-full flex items-center justify-center text-stone-900 px-1 truncate"
                  >
                    {directHppWidth >= 22 ? `HPP ${formatRupiah(activeRow.totalHppPerPcs)}` : directHppWidth >= 10 ? 'HPP' : ''}
                  </div>
                  <div
                    style={{ width: `${directProfitWidth}%` }}
                    className="bg-emerald-600 text-white h-full flex items-center justify-center px-1 truncate"
                  >
                    {directProfitWidth >= 22 ? `Laba ${formatRupiah(directChannel.profitPerUnit)}` : directProfitWidth >= 10 ? 'Laba' : ''}
                  </div>
                </div>
              </div>

              {/* Channel 2: Grosir Reseller */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-900">
                    Grosir Reseller ({resellerParams.resellerDiscountPercent}%)
                  </span>
                  <span className="font-mono font-semibold text-stone-900">
                    Laba: {formatRupiah(resellerChannel.profitPerUnit)} ({resellerChannel.netMarginPercent}%)
                  </span>
                </div>
                <div className="h-6 w-full bg-stone-100 rounded overflow-hidden flex border border-stone-200 font-mono text-[10px]">
                  <div
                    style={{ width: `${resellerHppWidth}%` }}
                    className="bg-stone-400 h-full flex items-center justify-center text-stone-900 px-1 truncate"
                  >
                    {resellerHppWidth >= 20 ? 'HPP' : ''}
                  </div>
                  <div
                    style={{ width: `${resellerDiscountWidth}%` }}
                    className="bg-amber-400 h-full flex items-center justify-center text-stone-900 px-1 truncate"
                  >
                    {resellerDiscountWidth >= 18 ? `Diskon ${resellerParams.resellerDiscountPercent}%` : resellerDiscountWidth >= 10 ? 'Diskon' : ''}
                  </div>
                  <div
                    style={{ width: `${resellerProfitWidth}%` }}
                    className="bg-emerald-600 text-white h-full flex items-center justify-center px-1 truncate"
                  >
                    {/* Only render text if width is at least 15% to prevent clipping */}
                    {resellerProfitWidth >= 18 ? `Laba ${formatRupiah(resellerChannel.profitPerUnit)}` : resellerProfitWidth >= 10 ? 'Laba' : ''}
                  </div>
                </div>
              </div>

              {/* Channel 3: Marketplace Online */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-stone-900">
                    Marketplace Online
                  </span>
                  <span
                    className={`font-mono font-semibold ${
                      marketplaceChannel.netMarginPercent >= 25
                        ? 'text-emerald-700'
                        : marketplaceChannel.netMarginPercent >= 15
                        ? 'text-amber-700'
                        : 'text-rose-700'
                    }`}
                  >
                    {isMarketplaceLoss ? (
                      `Rugi: ${formatRupiah(marketplaceChannel.profitPerUnit)} (${marketplaceChannel.netMarginPercent}%)`
                    ) : (
                      `Laba: ${formatRupiah(marketplaceChannel.profitPerUnit)} (${marketplaceChannel.netMarginPercent}%)`
                    )}
                  </span>
                </div>

                <div className="h-6 w-full bg-stone-100 rounded overflow-hidden flex border border-stone-200 font-mono text-[10px]">
                  <div
                    style={{ width: `${mktHppWidth}%` }}
                    className="bg-stone-400 h-full flex items-center justify-center text-stone-900 px-1 truncate"
                  >
                    {mktHppWidth >= 20 ? 'HPP' : ''}
                  </div>
                  <div
                    style={{ width: `${mktDeductionsWidth}%` }}
                    className="bg-amber-400 h-full flex items-center justify-center text-stone-900 px-1 truncate"
                  >
                    {mktDeductionsWidth >= 18 ? 'Potongan' : ''}
                  </div>

                  {isMarketplaceLoss ? (
                    <div
                      className="bg-rose-600 text-white h-full flex items-center justify-center px-1.5 font-semibold text-[10px] shrink-0"
                      title={`Defisit: ${formatRupiah(Math.abs(marketplaceChannel.profitPerUnit))}`}
                    >
                      Rugi {formatRupiah(Math.abs(marketplaceChannel.profitPerUnit))}
                    </div>
                  ) : (
                    <div
                      style={{ width: `${mktProfitWidth}%` }}
                      className={`${
                        marketplaceChannel.netMarginPercent >= 15 ? 'bg-emerald-600' : 'bg-amber-500'
                      } text-white h-full flex items-center justify-center px-1 truncate`}
                    >
                      {mktProfitWidth >= 18 ? `Laba ${formatRupiah(marketplaceChannel.profitPerUnit)}` : mktProfitWidth >= 10 ? 'Laba' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Comparison Table */}
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
            <div className="p-3.5 border-b border-stone-200">
              <h3 className="text-sm font-semibold text-stone-900">
                Matriks Komparasi 3 Jalur
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[520px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium whitespace-nowrap">
                    <th className="py-2.5 px-3">Metrik</th>
                    <th className="py-2.5 px-3 font-mono text-right">Langsung</th>
                    <th className="py-2.5 px-3 font-mono text-right">Reseller</th>
                    <th className="py-2.5 px-3 font-mono text-right">Marketplace</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono tabular-nums">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-stone-700 whitespace-nowrap">
                      Harga Jual / Pcs
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-stone-900 whitespace-nowrap">
                      {formatRupiah(directChannel.sellingPricePerUnit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-stone-900 whitespace-nowrap">
                      {formatRupiah(resellerChannel.sellingPricePerUnit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-stone-900 whitespace-nowrap">
                      {formatRupiah(marketplaceChannel.sellingPricePerUnit)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-stone-700 whitespace-nowrap">
                      HPP Pokok
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-600 whitespace-nowrap">
                      {formatRupiah(activeRow.totalHppPerPcs)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-600 whitespace-nowrap">
                      {formatRupiah(activeRow.totalHppPerPcs)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-600 whitespace-nowrap">
                      {formatRupiah(activeRow.totalHppPerPcs)}
                    </td>
                  </tr>

                  <tr>
                    <td className="py-2.5 px-3 font-sans font-medium text-stone-700 whitespace-nowrap">
                      Potongan / Diskon
                    </td>
                    <td className="py-2.5 px-3 text-right text-stone-500 whitespace-nowrap">Rp&nbsp;0 (0%)</td>
                    <td className="py-2.5 px-3 text-right text-amber-700 whitespace-nowrap">
                      {formatRupiah(activeRow.retailPrice - resellerChannel.sellingPricePerUnit)} (
                      {resellerParams.resellerDiscountPercent}%)
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-700 whitespace-nowrap">
                      {formatRupiah(marketplaceChannel.channelDeductionsTotal)} (
                      {marketplaceChannel.channelDeductionPercent}%)
                    </td>
                  </tr>

                  <tr className="bg-stone-50">
                    <td className="py-2.5 px-3 font-sans font-semibold text-stone-900 whitespace-nowrap">
                      Laba Bersih / Pcs
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {formatRupiah(directChannel.profitPerUnit)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-stone-900 whitespace-nowrap">
                      {formatRupiah(resellerChannel.profitPerUnit)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                        marketplaceChannel.netMarginPercent >= 25
                          ? 'text-emerald-700'
                          : marketplaceChannel.netMarginPercent >= 15
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {formatRupiah(marketplaceChannel.profitPerUnit)}
                    </td>
                  </tr>

                  <tr className="bg-stone-50">
                    <td className="py-2.5 px-3 font-sans font-semibold text-stone-900 whitespace-nowrap">
                      Margin Bersih (%)
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {formatPercent(directChannel.netMarginPercent)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-stone-900 whitespace-nowrap">
                      {formatPercent(resellerChannel.netMarginPercent)}
                    </td>
                    <td
                      className={`py-2.5 px-3 text-right font-semibold whitespace-nowrap ${
                        marketplaceChannel.netMarginPercent >= 25
                          ? 'text-emerald-700'
                          : marketplaceChannel.netMarginPercent >= 15
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {formatPercent(marketplaceChannel.netMarginPercent)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
