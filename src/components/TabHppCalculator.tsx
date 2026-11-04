import React, { useState } from 'react';
import {
  ProductItem,
  BatchParameters,
  PackagingCostConfig,
  RepackResult,
} from '../types/snacks';
import {
  formatRupiah,
  formatGram,
  formatPercent,
  calculateRepackMatrix,
} from '../utils/calculator';
import {
  ArrowRight,
  Plus,
  Trash2,
} from 'lucide-react';

interface TabHppCalculatorProps {
  products: ProductItem[];
  batch: BatchParameters;
  setBatch: React.Dispatch<React.SetStateAction<BatchParameters>>;
  packagingConfigs: PackagingCostConfig[];
  setPackagingConfigs: React.Dispatch<React.SetStateAction<PackagingCostConfig[]>>;
  onSelectSizeForSimulator: (sizeGram: number) => void;
  onGoToSimulator: () => void;
}

export const TabHppCalculator: React.FC<TabHppCalculatorProps> = ({
  products,
  batch,
  setBatch,
  packagingConfigs,
  setPackagingConfigs,
  onSelectSizeForSimulator,
  onGoToSimulator,
}) => {
  const [targetMargin, setTargetMargin] = useState<number>(35);
  const [showPackagingDetails, setShowPackagingDetails] = useState<boolean>(false);

  // Compute live calculations
  const { netYieldGram, totalBatchCost, costPerGram, rows } = calculateRepackMatrix(
    batch,
    packagingConfigs
  );

  // Handle Preset Product Selection
  const handleSelectProduct = (prodId: string) => {
    const found = products.find((p) => p.id === prodId);
    if (!found) return;

    setBatch((prev) => ({
      ...prev,
      productId: found.id,
      productName: found.nama,
      rawMaterialCost: found.defaultModalBatch || 300000,
      cookingCost: found.defaultMinyakGas || 45000,
      shrinkagePercent: found.defaultPenyusutan || 5,
    }));

    // Update retail price in packaging configs if default matches
    setPackagingConfigs((prev) =>
      prev.map((cfg) => {
        if (cfg.sizeGram === found.ukuranDefaultGram) {
          return { ...cfg, retailPrice: found.hargaEceran };
        }
        // Approximate other sizes proportionally if needed
        const ratio = cfg.sizeGram / (found.ukuranDefaultGram || 250);
        return {
          ...cfg,
          retailPrice: Math.round((found.hargaEceran * ratio) / 1000) * 1000,
        };
      })
    );
  };

  const handlePackagingChange = (
    sizeGram: number,
    field: keyof PackagingCostConfig,
    value: number
  ) => {
    setPackagingConfigs((prev) =>
      prev.map((item) => {
        if (item.sizeGram === sizeGram) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleAddCustomPackaging = () => {
    const customSize = 150;
    if (packagingConfigs.some((p) => p.sizeGram === customSize)) {
      alert('Ukuran 150g sudah ada di dalam tabel.');
      return;
    }
    const newConfig: PackagingCostConfig = {
      sizeGram: customSize,
      label: `${customSize}g`,
      pouchCost: 700,
      stickerCost: 400,
      extraCost: 100,
      retailPrice: 15000,
    };
    setPackagingConfigs((prev) => [...prev, newConfig].sort((a, b) => a.sizeGram - b.sizeGram));
  };

  const handleRemovePackaging = (sizeGram: number) => {
    if (packagingConfigs.length <= 1) {
      alert('Minimal harus ada 1 ukuran kemasan.');
      return;
    }
    setPackagingConfigs((prev) => prev.filter((p) => p.sizeGram !== sizeGram));
  };

  return (
    <div className="space-y-5">
      {/* Quick Archetype Preset Switcher */}
      <div className="bg-white border border-stone-200 rounded-lg p-3 sm:p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-700 shrink-0">Preset:</span>
            <span className="text-xs font-semibold text-stone-900 truncate">
              {batch.productName}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'PRD-001', name: 'Kacang Kapri' },
              { id: 'PRD-002', name: 'Kacang Bawang' },
              { id: 'PRD-003', name: 'Usus Krispi' },
              { id: 'PRD-004', name: 'Pang-Pang' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectProduct(preset.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors duration-150 ${
                  batch.productId === preset.id
                    ? 'bg-stone-900 text-white border-stone-900'
                    : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {preset.name}
              </button>
            ))}

            <select
              value={batch.productId}
              onChange={(e) => handleSelectProduct(e.target.value)}
              className="px-2 py-1 text-xs font-medium rounded-md border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:border-stone-400"
            >
              <option value="">Lainnya ({products.length} item)...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} ({p.ukuranDefaultGram}g)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2-Column Bento Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-5">
            <div className="pb-2.5 mb-3.5 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">
                1. Parameter Produksi Batch
              </h3>
            </div>

            <div className="space-y-3.5">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Nama Camilan
                </label>
                <input
                  type="text"
                  value={batch.productName}
                  onChange={(e) => setBatch({ ...batch, productName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs font-medium border border-stone-200 rounded-md bg-stone-50 text-stone-900 focus:outline-none focus:bg-white focus:border-stone-400"
                  placeholder="Nama produk camilan"
                />
              </div>

              {/* Raw Material Modal */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-stone-700">
                    Bahan & Bumbu (Rp)
                  </label>
                  <span className="text-xs font-mono text-stone-600">
                    {formatRupiah(batch.rawMaterialCost)}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-stone-400 font-mono">Rp</span>
                  <input
                    type="number"
                    value={batch.rawMaterialCost || ''}
                    onChange={(e) =>
                      setBatch({ ...batch, rawMaterialCost: Number(e.target.value) || 0 })
                    }
                    className="w-full pl-9 pr-3 py-1.5 text-xs font-mono tabular-nums border border-stone-200 rounded-md text-stone-900 focus:outline-none focus:border-stone-400"
                    placeholder="375000"
                  />
                </div>
              </div>

              {/* Batch Weight & Shrinkage */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Berat Mentah (Gram)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={batch.batchWeightGram || ''}
                      onChange={(e) =>
                        setBatch({ ...batch, batchWeightGram: Number(e.target.value) || 0 })
                      }
                      className="w-full pr-7 pl-3 py-1.5 text-xs font-mono tabular-nums border border-stone-200 rounded-md text-stone-900 focus:outline-none focus:border-stone-400"
                      placeholder="5000"
                    />
                    <span className="absolute right-2.5 top-2 text-xs text-stone-400 font-mono">g</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-stone-700">
                      Susut Masak (%)
                    </label>
                    <span className="text-xs font-mono text-stone-600">
                      {batch.shrinkagePercent}%
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={40}
                      step={0.5}
                      value={batch.shrinkagePercent || ''}
                      onChange={(e) =>
                        setBatch({ ...batch, shrinkagePercent: Number(e.target.value) || 0 })
                      }
                      className="w-full pr-7 pl-3 py-1.5 text-xs font-mono tabular-nums border border-stone-200 rounded-md text-stone-900 focus:outline-none focus:border-stone-400"
                      placeholder="4"
                    />
                    <span className="absolute right-2.5 top-2 text-xs text-stone-400 font-mono">%</span>
                  </div>
                </div>
              </div>

              {/* Cooking & Utilities Cost */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-stone-700">
                      Minyak & Gas (Rp)
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-stone-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={batch.cookingCost || ''}
                      onChange={(e) =>
                        setBatch({ ...batch, cookingCost: Number(e.target.value) || 0 })
                      }
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono tabular-nums border border-stone-200 rounded-md text-stone-900 focus:outline-none focus:border-stone-400"
                      placeholder="45000"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-stone-700">
                      Upah Masak (Rp)
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2 text-xs text-stone-400 font-mono">Rp</span>
                    <input
                      type="number"
                      value={batch.laborOverheadCost || ''}
                      onChange={(e) =>
                        setBatch({ ...batch, laborOverheadCost: Number(e.target.value) || 0 })
                      }
                      className="w-full pl-8 pr-2.5 py-1.5 text-xs font-mono tabular-nums border border-stone-200 rounded-md text-stone-900 focus:outline-none focus:border-stone-400"
                      placeholder="15000"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Biaya Kemasan per Ukuran */}
          <div className="bg-white border border-stone-200 rounded-lg p-4 sm:p-5">
            <div className="flex items-center justify-between pb-2.5 mb-3.5 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">
                2. Biaya Kemasan per Pcs
              </h3>
              <button
                type="button"
                onClick={() => setShowPackagingDetails(!showPackagingDetails)}
                className="text-xs text-stone-600 hover:text-stone-900 underline font-medium"
              >
                {showPackagingDetails ? 'Tutup Rincian' : 'Rincian Biaya'}
              </button>
            </div>

            <div className="space-y-2.5">
              {packagingConfigs.map((cfg) => {
                const totalPack = cfg.pouchCost + cfg.stickerCost + cfg.extraCost;
                return (
                  <div
                    key={cfg.sizeGram}
                    className="p-2.5 bg-stone-50 border border-stone-200 rounded-md space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-stone-900 font-mono">
                          {cfg.label}
                        </span>
                        <span className="text-[11px] text-stone-500 font-mono">
                          ({cfg.sizeGram}g)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-medium text-stone-900">
                          {formatRupiah(totalPack)}
                        </span>
                        {packagingConfigs.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePackaging(cfg.sizeGram)}
                            className="text-stone-400 hover:text-rose-600 p-0.5"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>

                    {showPackagingDetails && (
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200">
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-0.5">
                            Pouch (Rp)
                          </label>
                          <input
                            type="number"
                            value={cfg.pouchCost}
                            onChange={(e) =>
                              handlePackagingChange(
                                cfg.sizeGram,
                                'pouchCost',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 text-xs font-mono border border-stone-200 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-0.5">
                            Stiker (Rp)
                          </label>
                          <input
                            type="number"
                            value={cfg.stickerCost}
                            onChange={(e) =>
                              handlePackagingChange(
                                cfg.sizeGram,
                                'stickerCost',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 text-xs font-mono border border-stone-200 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-500 mb-0.5">
                            Klip/Lain (Rp)
                          </label>
                          <input
                            type="number"
                            value={cfg.extraCost}
                            onChange={(e) =>
                              handlePackagingChange(
                                cfg.sizeGram,
                                'extraCost',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 text-xs font-mono border border-stone-200 rounded bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={handleAddCustomPackaging}
                className="w-full py-1.5 border border-dashed border-stone-300 rounded-md text-xs font-medium text-stone-600 hover:text-stone-900 hover:border-stone-400 bg-white transition-colors duration-150 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Tambah Ukuran 150g</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Bento Metrics & Repacking Matrix Table */}
        <div className="lg:col-span-7 space-y-5">
          {/* Bento Summary KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white border border-stone-200 rounded-lg p-3">
              <span className="text-[11px] font-medium text-stone-500">
                Hasil Bersih Siap Kemas
              </span>
              <p className="text-base sm:text-lg font-semibold text-stone-900 font-mono tabular-nums mt-0.5">
                {formatGram(netYieldGram)}
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-3">
              <span className="text-[11px] font-medium text-stone-500">
                Total Biaya Batch
              </span>
              <p className="text-base sm:text-lg font-semibold text-stone-900 font-mono tabular-nums mt-0.5">
                {formatRupiah(totalBatchCost)}
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-3">
              <span className="text-[11px] font-medium text-stone-500">
                Biaya Bahan / Gram
              </span>
              <p className="text-base sm:text-lg font-semibold text-stone-900 font-mono tabular-nums mt-0.5">
                Rp {costPerGram.toFixed(1)}/g
              </p>
            </div>

            <div className="bg-white border border-stone-200 rounded-lg p-3">
              <span className="text-[11px] font-medium text-stone-500">
                Status Biaya
              </span>
              <p className="text-sm font-semibold text-emerald-700 font-mono mt-1">
                Siap Jual
              </p>
            </div>
          </div>

          {/* Repacking Matrix Table */}
          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
            <div className="p-3.5 border-b border-stone-200 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-stone-900">
                  Matriks Repacking per Ukuran
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-stone-500">Target Margin:</span>
                <div className="flex items-center gap-1 bg-stone-100 border border-stone-200 rounded px-1.5 py-0.5">
                  <input
                    type="number"
                    min={10}
                    max={70}
                    value={targetMargin}
                    onChange={(e) => setTargetMargin(Number(e.target.value) || 30)}
                    className="w-8 text-xs font-mono font-medium text-stone-900 bg-transparent text-center focus:outline-none"
                  />
                  <span className="text-stone-500 font-mono text-[11px]">%</span>
                </div>
              </div>
            </div>

            {/* Responsive Table with font-mono tabular-nums */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-700 font-semibold text-xs whitespace-nowrap">
                    <th className="py-3 px-3.5 text-left">Ukuran</th>
                    <th className="py-3 px-3.5 text-right font-mono">Pcs</th>
                    <th className="py-3 px-3.5 text-right font-mono">HPP Bahan</th>
                    <th className="py-3 px-3.5 text-right font-mono">Kemasan</th>
                    <th className="py-3 px-3.5 text-right font-mono">Total HPP</th>
                    <th className="py-3 px-3.5 text-right font-mono">Harga Ecer</th>
                    <th className="py-3 px-3.5 text-right font-mono">Laba</th>
                    <th className="py-3 px-3.5 text-right font-mono">Margin</th>
                    <th className="py-3 px-3.5 text-center">Status</th>
                    <th className="py-3 px-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {rows.map((row) => {
                    const recommendedPrice =
                      Math.ceil((row.totalHppPerPcs / (1 - targetMargin / 100)) / 500) * 500;

                    let statusBadge = (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-700 whitespace-nowrap">
                        Sehat
                      </span>
                    );
                    if (row.healthStatus === 'warning') {
                      statusBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border border-amber-200 bg-amber-50 text-amber-700 whitespace-nowrap">
                          Tipis
                        </span>
                      );
                    } else if (row.healthStatus === 'danger') {
                      statusBadge = (
                        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded border border-rose-200 bg-rose-50 text-rose-700 whitespace-nowrap">
                          Kritis
                        </span>
                      );
                    }

                    return (
                      <tr key={row.sizeGram} className="hover:bg-stone-50 transition-colors duration-150">
                        {/* Ukuran */}
                        <td className="py-3 px-3.5 font-semibold text-stone-900 font-mono whitespace-nowrap">
                          {row.label}
                        </td>

                        {/* Pcs */}
                        <td className="py-3 px-3.5 font-mono tabular-nums text-right text-stone-700 whitespace-nowrap">
                          {row.pcsProduced}
                        </td>

                        {/* HPP Bahan */}
                        <td className="py-3 px-3.5 font-mono tabular-nums text-right text-stone-600 whitespace-nowrap">
                          {formatRupiah(row.rawMaterialHppPerPcs)}
                        </td>

                        {/* Kemasan */}
                        <td className="py-3 px-3.5 font-mono tabular-nums text-right text-stone-600 whitespace-nowrap">
                          {formatRupiah(row.packagingCostPerPcs)}
                        </td>

                        {/* Total HPP */}
                        <td className="py-3 px-3.5 font-mono tabular-nums text-right font-semibold text-stone-900 whitespace-nowrap">
                          {formatRupiah(row.totalHppPerPcs)}
                        </td>

                        {/* Harga Ecer (Single Line input with target tooltip) */}
                        <td className="py-3 px-3.5 text-right whitespace-nowrap">
                          <input
                            type="number"
                            value={row.retailPrice || ''}
                            title={`Target: ${formatRupiah(recommendedPrice)} (Margin ${targetMargin}%)`}
                            onChange={(e) =>
                              handlePackagingChange(
                                row.sizeGram,
                                'retailPrice',
                                Number(e.target.value) || 0
                              )
                            }
                            className="w-24 px-2 py-1 text-xs font-mono tabular-nums text-right font-semibold text-stone-900 border border-stone-200 rounded bg-white focus:outline-none focus:border-stone-400"
                          />
                        </td>

                        {/* Laba Bersih */}
                        <td
                          className={`py-3 px-3.5 font-mono tabular-nums text-right font-semibold whitespace-nowrap ${
                            row.netProfitPerPcs >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {formatRupiah(row.netProfitPerPcs)}
                        </td>

                        {/* Margin % */}
                        <td
                          className={`py-3 px-3.5 font-mono tabular-nums text-right font-semibold whitespace-nowrap ${
                            row.marginPercent >= 30
                              ? 'text-emerald-700'
                              : row.marginPercent >= 15
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                        >
                          {formatPercent(row.marginPercent)}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">{statusBadge}</td>

                        {/* Aksi */}
                        <td className="py-3 px-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              onSelectSizeForSimulator(row.sizeGram);
                              onGoToSimulator();
                            }}
                            title={`Simulasi ${row.label}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 transition-colors duration-150 whitespace-nowrap cursor-pointer"
                          >
                            <span>Simulasi</span>
                            <ArrowRight className="w-3 h-3 text-stone-400" strokeWidth={1.5} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary without verbose instructions */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-stone-500 gap-1.5">
              <span>Status: ≥30% Sehat • 15–29% Tipis • &lt;15% Kritis</span>
              <span className="font-mono text-stone-500 tabular-nums">Target Margin: {targetMargin}%</span>
            </div>
          </div>

          {/* Quick Production Batch Insights */}
          <div className="bg-white border border-stone-200 rounded-lg p-3.5 sm:p-4">
            <h4 className="text-xs font-semibold text-stone-700 mb-2.5">
              Proyeksi Penjualan 1 Batch:
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {rows.map((r) => {
                const totalOmzet = r.pcsProduced * r.retailPrice;
                const totalProfit = r.pcsProduced * r.netProfitPerPcs;
                return (
                  <div
                    key={r.sizeGram}
                    className="p-2.5 bg-stone-50 border border-stone-200 rounded-md text-xs font-mono"
                  >
                    <span className="font-semibold text-stone-900 block font-sans">
                      Kemasan {r.label}
                    </span>
                    <div className="mt-1.5 flex justify-between gap-1">
                      <span className="text-[11px] text-stone-500 font-sans">Omzet:</span>
                      <span className="font-medium text-stone-900 tabular-nums whitespace-nowrap">{formatRupiah(totalOmzet)}</span>
                    </div>
                    <div className="flex justify-between gap-1">
                      <span className="text-[11px] text-stone-500 font-sans">Laba:</span>
                      <span className="font-semibold text-emerald-700 tabular-nums whitespace-nowrap">{formatRupiah(totalProfit)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
