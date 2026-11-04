/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ProductItem,
  BatchParameters,
  PackagingCostConfig,
  ResellerMarketplaceParams,
} from './types/snacks';
import { INITIAL_PRODUCTS } from './data/defaultCatalog';
import { calculateRepackMatrix, calculateChannelSimulations } from './utils/calculator';
import { TopBar } from './components/TopBar';
import { TabHppCalculator } from './components/TabHppCalculator';
import { TabMarketplaceSimulator } from './components/TabMarketplaceSimulator';
import { TabKnowledgeBaseAndAI } from './components/TabKnowledgeBaseAndAI';
import { UploadCsvModal } from './components/UploadCsvModal';
import { ExportModal } from './components/ExportModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calculator' | 'simulator' | 'consultant'>('calculator');

  // Master Products Catalog (Knowledge Base)
  const [products, setProducts] = useState<ProductItem[]>(INITIAL_PRODUCTS);

  // Active Batch Parameters (Default: PRD-001 Kacang Kapri Bali)
  const [batch, setBatch] = useState<BatchParameters>({
    productId: 'PRD-001',
    productName: 'Kacang Kapri Bali Spesial',
    batchWeightGram: 5000,
    shrinkagePercent: 4,
    rawMaterialCost: 375000,
    cookingCost: 45000,
    laborOverheadCost: 15000,
  });

  // Packaging Configs
  const [packagingConfigs, setPackagingConfigs] = useState<PackagingCostConfig[]>([
    {
      sizeGram: 100,
      label: '100g',
      pouchCost: 600,
      stickerCost: 400,
      extraCost: 50,
      retailPrice: 12000,
    },
    {
      sizeGram: 250,
      label: '250g',
      pouchCost: 850,
      stickerCost: 450,
      extraCost: 100,
      retailPrice: 25000,
    },
    {
      sizeGram: 500,
      label: '500g',
      pouchCost: 1200,
      stickerCost: 500,
      extraCost: 150,
      retailPrice: 48000,
    },
    {
      sizeGram: 1000,
      label: '1 Kg',
      pouchCost: 1800,
      stickerCost: 600,
      extraCost: 200,
      retailPrice: 92000,
    },
  ]);

  // Reseller and Marketplace Simulator Parameters
  const [resellerParams, setResellerParams] = useState<ResellerMarketplaceParams>({
    selectedSizeGram: 250,
    resellerDiscountPercent: 15,
    resellerMoq: 15,
    marketplaceAdminPercent: 8.5,
    marketplaceFreeShippingPercent: 4.0,
    marketplaceFixedFee: 1000,
    marketplacePackagingExtra: 1500,
  });

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Derived Calculations
  const { netYieldGram, totalBatchCost, costPerGram, rows: repackRows } = calculateRepackMatrix(
    batch,
    packagingConfigs
  );

  const activeRepackRow =
    repackRows.find((r) => r.sizeGram === resellerParams.selectedSizeGram) ||
    repackRows.find((r) => r.sizeGram === 250) ||
    repackRows[0];

  const simulations = activeRepackRow
    ? calculateChannelSimulations(activeRepackRow, resellerParams)
    : [];

  const handleUpdateRetailPrice = (sizeGram: number, newPrice: number) => {
    setPackagingConfigs((prev) =>
      prev.map((cfg) => (cfg.sizeGram === sizeGram ? { ...cfg, retailPrice: newPrice } : cfg))
    );
  };

  const handleResetData = () => {
    if (confirm('Reset parameter kalkulasi dan katalog ke pengaturan default pabrik?')) {
      setProducts(INITIAL_PRODUCTS);
      setBatch({
        productId: 'PRD-001',
        productName: 'Kacang Kapri Bali Spesial',
        batchWeightGram: 5000,
        shrinkagePercent: 4,
        rawMaterialCost: 375000,
        cookingCost: 45000,
        laborOverheadCost: 15000,
      });
      setResellerParams({
        selectedSizeGram: 250,
        resellerDiscountPercent: 15,
        resellerMoq: 15,
        marketplaceAdminPercent: 8.5,
        marketplaceFreeShippingPercent: 4.0,
        marketplaceFixedFee: 1000,
        marketplacePackagingExtra: 1500,
      });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-stone-200">
      {/* Top Bar with Minimal Swiss Design */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUploadModal={() => setIsUploadModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onResetData={handleResetData}
        totalProductsCount={products.length}
      />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'calculator' && (
          <TabHppCalculator
            products={products}
            batch={batch}
            setBatch={setBatch}
            packagingConfigs={packagingConfigs}
            setPackagingConfigs={setPackagingConfigs}
            onSelectSizeForSimulator={(sizeGram) =>
              setResellerParams((prev) => ({ ...prev, selectedSizeGram: sizeGram }))
            }
            onGoToSimulator={() => setActiveTab('simulator')}
          />
        )}

        {activeTab === 'simulator' && (
          <TabMarketplaceSimulator
            repackRows={repackRows}
            productName={batch.productName}
            resellerParams={resellerParams}
            setResellerParams={setResellerParams}
            onUpdateRetailPrice={handleUpdateRetailPrice}
          />
        )}

        {activeTab === 'consultant' && (
          <TabKnowledgeBaseAndAI
            products={products}
            setProducts={setProducts}
            batch={batch}
            repackRows={repackRows}
            resellerParams={resellerParams}
            onResetProductsToDefault={() => setProducts(INITIAL_PRODUCTS)}
          />
        )}
      </main>

      {/* Clean Footer */}
      <footer className="mt-12 border-t border-stone-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-900">KriukMetrics</span>
            <span>• Solusi Finansial & Operasional Repacking UMKM Camilan</span>
          </div>
          <div className="font-mono text-[11px] text-stone-400">
            Ekraf Future Talents • Topik 1 & 2 & 3 Terpadu
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadCsvModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onApplyProducts={(newProds) => {
          setProducts(newProds);
          alert(`Berhasil memperbarui Knowledge Base dengan ${newProds.length} produk.`);
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        batch={batch}
        netYieldGram={netYieldGram}
        totalBatchCost={totalBatchCost}
        costPerGram={costPerGram}
        repackRows={repackRows}
        simulations={simulations}
      />
    </div>
  );
}
