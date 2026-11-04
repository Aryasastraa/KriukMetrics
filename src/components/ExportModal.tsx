import React, { useRef } from 'react';
import {
  BatchParameters,
  RepackResult,
  ChannelSimulationResult,
} from '../types/snacks';
import {
  formatRupiah,
  formatGram,
  formatPercent,
} from '../utils/calculator';
import { exportRepackingReportCsv, downloadCsvFile } from '../utils/csvParser';
import {
  FileSpreadsheet,
  Printer,
  X,
  Download,
  Scale,
  CheckCircle2,
} from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: BatchParameters;
  netYieldGram: number;
  totalBatchCost: number;
  costPerGram: number;
  repackRows: RepackResult[];
  simulations: ChannelSimulationResult[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  batch,
  netYieldGram,
  totalBatchCost,
  costPerGram,
  repackRows,
  simulations,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    const csvContent = exportRepackingReportCsv(
      batch.productName,
      batch.batchWeightGram,
      batch.shrinkagePercent,
      netYieldGram,
      totalBatchCost,
      costPerGram,
      repackRows,
      simulations
    );
    const dateStr = new Date().toISOString().split('T')[0];
    downloadCsvFile(`KriukMetrics_${batch.productName.replace(/\s+/g, '_')}_${dateStr}.csv`, csvContent);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-lg max-w-3xl w-full p-6 space-y-5 shadow-xs max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-stone-700" strokeWidth={1.5} />
            <div>
              <h3 className="text-sm font-semibold text-stone-900">
                Ekspor Laporan Finansial & HPP
              </h3>
              <p className="text-xs text-stone-500">
                Unduh file CSV atau cetak dokumen (PDF / Print).
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Printable Document Preview Area */}
        <div
          ref={printAreaRef}
          className="border border-stone-200 rounded-md p-6 bg-white space-y-6 text-stone-900"
        >
          {/* Header Document */}
          <div className="flex justify-between items-start pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-stone-900 text-white rounded flex items-center justify-center font-bold text-xs">
                  KM
                </div>
                <span className="text-base font-bold tracking-tight text-stone-900">
                  KriukMetrics
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Laporan Hasil Kalkulasi HPP, Matriks Repacking & Simulasi Multi-Channel
              </p>
            </div>

            <div className="text-right text-xs font-mono text-stone-500">
              <p>Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              <p>Status: Terverifikasi Sistem</p>
            </div>
          </div>

          {/* Batch Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-stone-50 border border-stone-200 rounded text-xs font-mono">
            <div>
              <span className="text-stone-500 block text-[10px]">Nama Produk:</span>
              <strong className="text-stone-900 font-sans">{batch.productName}</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Berat Mentah / Susut:</span>
              <strong className="text-stone-900">
                {formatGram(batch.batchWeightGram)} ({batch.shrinkagePercent}%)
              </strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Hasil Matang Bersih:</span>
              <strong className="text-stone-900">{formatGram(netYieldGram)}</strong>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">Total Modal Batch:</span>
              <strong className="text-stone-900">{formatRupiah(totalBatchCost)}</strong>
            </div>
          </div>

          {/* Repacking Table Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
              1. Matriks Repacking per Ukuran Kemasan
            </h4>
            <div className="border border-stone-200 rounded overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium font-sans">
                  <tr>
                    <th className="py-2 px-2.5">Ukuran</th>
                    <th className="py-2 px-2.5 text-right font-mono">Estimasi Pcs</th>
                    <th className="py-2 px-2.5 text-right font-mono">Total HPP</th>
                    <th className="py-2 px-2.5 text-right font-mono">Harga Jual</th>
                    <th className="py-2 px-2.5 text-right font-mono">Laba/Pcs</th>
                    <th className="py-2 px-2.5 text-right font-mono">Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono tabular-nums">
                  {repackRows.map((r) => (
                    <tr key={r.sizeGram}>
                      <td className="py-2 px-2.5 font-semibold font-sans">{r.label}</td>
                      <td className="py-2 px-2.5 text-right text-stone-600">{r.pcsProduced} pcs</td>
                      <td className="py-2 px-2.5 text-right text-stone-700">{formatRupiah(r.totalHppPerPcs)}</td>
                      <td className="py-2 px-2.5 text-right font-medium text-stone-900">{formatRupiah(r.retailPrice)}</td>
                      <td className="py-2 px-2.5 text-right text-emerald-700 font-semibold">{formatRupiah(r.netProfitPerPcs)}</td>
                      <td className="py-2 px-2.5 text-right font-semibold">{formatPercent(r.marginPercent)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Channel Simulation Preview */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-stone-800 uppercase tracking-wider">
              2. Perbandingan Laba Bersih 3 Saluran Penjualan
            </h4>
            <div className="border border-stone-200 rounded overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-medium font-sans">
                  <tr>
                    <th className="py-2 px-2.5">Saluran</th>
                    <th className="py-2 px-2.5 text-right font-mono">Harga/Pcs</th>
                    <th className="py-2 px-2.5 text-right font-mono">Potongan Saluran</th>
                    <th className="py-2 px-2.5 text-right font-mono">Laba Bersih</th>
                    <th className="py-2 px-2.5 text-right font-mono">Margin Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-mono tabular-nums">
                  {simulations.map((s) => (
                    <tr key={s.channelName}>
                      <td className="py-2 px-2.5 font-sans font-medium text-stone-900">{s.channelName}</td>
                      <td className="py-2 px-2.5 text-right">{formatRupiah(s.sellingPricePerUnit)}</td>
                      <td className="py-2 px-2.5 text-right text-amber-700">
                        {formatRupiah(s.channelDeductionsTotal)} ({s.channelDeductionPercent}%)
                      </td>
                      <td className="py-2 px-2.5 text-right font-semibold text-emerald-700">
                        {formatRupiah(s.netProfitReceived)}
                      </td>
                      <td className="py-2 px-2.5 text-right font-semibold">
                        {formatPercent(s.netMarginPercent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-[10px] text-stone-400 text-center pt-2">
            Dokumen ini dicetak secara otomatis dari aplikasi KriukMetrics — Sistem Kalkulasi HPP UMKM Camilan.
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-md border border-stone-200 bg-white text-xs font-medium text-stone-700 hover:bg-stone-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md border border-stone-200 bg-white text-xs font-medium text-stone-800 hover:bg-stone-50"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" strokeWidth={1.5} />
            <span>Unduh Laporan (CSV)</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-stone-900 text-white text-xs font-medium hover:bg-stone-800"
          >
            <Printer className="w-3.5 h-3.5 text-white" strokeWidth={1.5} />
            <span>Cetak / Cetak PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
