import React, { useState } from 'react';
import {
  Menu,
  X,
  Upload,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';

interface TopBarProps {
  activeTab: 'calculator' | 'simulator' | 'consultant';
  setActiveTab: (tab: 'calculator' | 'simulator' | 'consultant') => void;
  onOpenUploadModal: () => void;
  onOpenExportModal: () => void;
  onResetData: () => void;
  totalProductsCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenUploadModal,
  onOpenExportModal,
  onResetData,
  totalProductsCount,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSelectTab = (tab: 'calculator' | 'simulator' | 'consultant') => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Clean Modern Logo (No version card) */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-7 h-7 rounded bg-stone-900 text-white flex items-center justify-center font-mono font-bold text-xs tracking-wider">
                KM
              </div>
              <div className="flex flex-col">
                <span className="text-sm sm:text-base font-semibold tracking-tight text-stone-900 leading-none">
                  KriukMetrics
                </span>
                <span className="text-[10px] text-stone-500 font-mono leading-none mt-0.5 hidden sm:block">
                  Sistem Kalkulasi HPP & Strategi Harga
                </span>
              </div>
            </div>

            {/* Desktop & Tablet Navbar - 1 Word Each, Clean & Elegant */}
            <nav className="hidden md:flex items-center gap-7 h-full">
              <button
                type="button"
                onClick={() => handleSelectTab('calculator')}
                className={`h-14 sm:h-16 text-sm font-medium transition-colors duration-150 border-b-2 flex items-center ${
                  activeTab === 'calculator'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                Kalkulator
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab('simulator')}
                className={`h-14 sm:h-16 text-sm font-medium transition-colors duration-150 border-b-2 flex items-center ${
                  activeTab === 'simulator'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                Simulator
              </button>

              <button
                type="button"
                onClick={() => handleSelectTab('consultant')}
                className={`h-14 sm:h-16 text-sm font-medium transition-colors duration-150 border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'consultant'
                    ? 'border-stone-900 text-stone-900 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'
                }`}
              >
                <span>Konsultan</span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-stone-100 text-stone-600 border border-stone-200">
                  {totalProductsCount}
                </span>
              </button>
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors duration-150 flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />
                <span>Upload CSV</span>
              </button>

              <button
                type="button"
                onClick={onOpenExportModal}
                className="px-2.5 py-1.5 text-xs font-medium rounded-md border border-stone-200 bg-white text-stone-800 hover:bg-stone-50 transition-colors duration-150 flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />
                <span>Export</span>
              </button>

              <button
                type="button"
                onClick={onResetData}
                title="Reset Data Default"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors duration-150"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              </button>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenExportModal}
                className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                title="Export Laporan"
              >
                <FileSpreadsheet className="w-4 h-4" strokeWidth={1.5} />
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-stone-800 hover:bg-stone-100 rounded-md transition-colors focus:outline-none"
                aria-label="Buka Menu"
              >
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar Panel */}
          <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white border-l border-stone-200 shadow-none p-5 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-4 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-stone-900 text-white flex items-center justify-center font-mono font-bold text-xs">
                    KM
                  </div>
                  <span className="font-semibold text-stone-900 text-sm">
                    KriukMetrics
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors"
                  aria-label="Tutup Menu"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2 mb-2 font-mono">
                  Navigasi Modul
                </p>

                <button
                  type="button"
                  onClick={() => handleSelectTab('calculator')}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'calculator'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Kalkulator
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('simulator')}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'simulator'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  Simulator
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTab('consultant')}
                  className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors flex items-center justify-between ${
                    activeTab === 'consultant'
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span>Konsultan</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-mono rounded ${
                      activeTab === 'consultant'
                        ? 'bg-stone-800 text-stone-200'
                        : 'bg-stone-100 text-stone-600 border border-stone-200'
                    }`}
                  >
                    {totalProductsCount} produk
                  </span>
                </button>
              </div>

              {/* Quick Actions in Sidebar */}
              <div className="pt-4 border-t border-stone-200 space-y-2">
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-2 mb-2 font-mono">
                  Aksi & Data
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenUploadModal();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />
                  <span>Upload CSV Knowledge Base</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenExportModal();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-stone-700 hover:bg-stone-100 rounded-md transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />
                  <span>Export Laporan (CSV / Cetak)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onResetData();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" strokeWidth={1.5} />
                  <span>Reset Data Default</span>
                </button>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="pt-4 border-t border-stone-100 text-[11px] text-stone-400 font-mono">
              KriukMetrics • UMKM Camilan
            </div>
          </div>
        </div>
      )}
    </>
  );
};
