import React, { useState } from 'react';
import { ProductItem } from '../types/snacks';
import { parseProductCatalogFromCsv } from '../utils/csvParser';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

interface UploadCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyProducts: (products: ProductItem[]) => void;
}

export const UploadCsvModal: React.FC<UploadCsvModalProps> = ({
  isOpen,
  onClose,
  onApplyProducts,
}) => {
  const [csvText, setCsvText] = useState('');
  const [previewProducts, setPreviewProducts] = useState<ProductItem[]>([]);
  const [fileName, setFileName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      processCsv(content);
    };
    reader.readAsText(file);
  };

  const processCsv = (text: string) => {
    setErrorMessage('');
    try {
      const parsed = parseProductCatalogFromCsv(text);
      if (parsed.length === 0) {
        setErrorMessage('Tidak ada baris produk yang valid ditemukan dalam format CSV ini.');
        setPreviewProducts([]);
      } else {
        setPreviewProducts(parsed);
      }
    } catch (err: any) {
      setErrorMessage(`Gagal membaca format CSV: ${err.message}`);
      setPreviewProducts([]);
    }
  };

  const handleApply = () => {
    if (previewProducts.length === 0) {
      alert('Harap unggah atau tempel CSV yang valid terlebih dahulu.');
      return;
    }
    onApplyProducts(previewProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-lg max-w-xl w-full p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-stone-700" strokeWidth={1.5} />
            <h3 className="text-sm font-semibold text-stone-900">
              Unggah CSV Katalog Produk
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        <p className="text-xs text-stone-500">
          Unggah file CSV dari Google Sheets atau database toko untuk memperbarui data produk.
        </p>

        {/* File Drop Area */}
        <div className="border border-dashed border-stone-300 rounded-lg p-5 text-center bg-stone-50 hover:bg-stone-100/60 transition-colors duration-150">
          <label className="cursor-pointer block space-y-2">
            <FileText className="w-8 h-8 text-stone-400 mx-auto" strokeWidth={1.5} />
            <span className="text-xs font-semibold text-stone-800 block">
              Pilih file .csv dari perangkat Anda
            </span>
            <span className="text-[11px] text-stone-500 block">
              {fileName ? `File terpilih: ${fileName}` : 'Atau seret dan lepas file ke sini'}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Or Paste Raw CSV */}
        <div>
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Atau Tempel (Paste) Teks CSV Langsung:
          </label>
          <textarea
            rows={4}
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              processCsv(e.target.value);
            }}
            placeholder="ID Produk,Nama Produk,Kategori,Varian Rasa,Ukuran Kemasan (gram),Harga Eceran (Rp)..."
            className="w-full p-2.5 text-[11px] font-mono border border-stone-200 rounded-md bg-stone-50 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Error or Success Info */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>{errorMessage}</span>
          </div>
        )}

        {previewProducts.length > 0 && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={1.5} />
              <span>
                Berhasil mendeteksi <strong>{previewProducts.length} produk</strong> siap dimuat.
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700">Format Valid</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-stone-200 bg-white text-xs text-stone-700 hover:bg-stone-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={previewProducts.length === 0}
            className="px-4 py-1.5 rounded-md bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 disabled:opacity-50"
          >
            Terapkan ke Knowledge Base ({previewProducts.length} Produk)
          </button>
        </div>
      </div>
    </div>
  );
};
