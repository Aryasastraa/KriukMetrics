import { ProductItem, RepackResult, ChannelSimulationResult } from '../types/snacks';

// Parse raw CSV string into array of lines respecting quoted values
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some((cell) => cell.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((cell) => cell.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

export function parseRupiah(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const cleaned = value.replace(/[^0-9]/g, '');
  return parseInt(cleaned, 10) || 0;
}

export function parseProductCatalogFromCsv(csvText: string): ProductItem[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  // Assume row 0 is header
  const dataRows = rows.slice(1);
  return dataRows.map((cols, idx) => {
    // Header format:
    // ID Produk,Nama Produk,Kategori,Varian Rasa,Ukuran Kemasan (gram),Harga Eceran (Rp),Harga Reseller/Grosir (Rp),Min. Order Grosir (pcs),Deskripsi Singkat & Tekstur,Komposisi Utama,Info Alergen,Daya Tahan / Masa Simpan,Cocok Untuk Momen,Status Stok
    const id = cols[0] || `PRD-${String(idx + 1).padStart(3, '0')}`;
    const nama = cols[1] || 'Produk Baru';
    const kategori = cols[2] || 'Camilan';
    const varianRasa = cols[3] || 'Original';
    const ukuranDefaultGram = parseInt(cols[4], 10) || 250;
    const hargaEceran = parseRupiah(cols[5]);
    const hargaReseller = parseRupiah(cols[6]) || Math.round(hargaEceran * 0.85);
    const minOrderGrosir = parseInt(cols[7], 10) || 10;
    const deskripsi = cols[8] || '';
    const komposisi = cols[9] || '';
    const alergen = cols[10] || 'Tidak ada';
    const masaSimpan = cols[11] || '6 Bulan';
    const momen = cols[12] || 'Camilan Sehari-hari';
    const statusStokRaw = (cols[13] || '').trim();
    const statusStok =
      statusStokRaw === 'Pre-Order' ? 'Pre-Order' : statusStokRaw === 'Habis' ? 'Habis' : 'Tersedia';

    return {
      id,
      nama,
      kategori,
      varianRasa,
      ukuranDefaultGram,
      hargaEceran,
      hargaReseller,
      minOrderGrosir,
      deskripsi,
      komposisi,
      alergen,
      masaSimpan,
      momen,
      statusStok,
    };
  });
}

export function exportCatalogToCsv(products: ProductItem[]): string {
  const headers = [
    'ID Produk',
    'Nama Produk',
    'Kategori',
    'Varian Rasa',
    'Ukuran Kemasan (gram)',
    'Harga Eceran (Rp)',
    'Harga Reseller/Grosir (Rp)',
    'Min. Order Grosir (pcs)',
    'Deskripsi Singkat & Tekstur',
    'Komposisi Utama',
    'Info Alergen',
    'Daya Tahan / Masa Simpan',
    'Cocok Untuk Momen',
    'Status Stok',
  ];

  const escapeCell = (val: any) => {
    const s = String(val ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const lines = [
    headers.map(escapeCell).join(','),
    ...products.map((p) =>
      [
        p.id,
        p.nama,
        p.kategori,
        p.varianRasa,
        p.ukuranDefaultGram,
        `Rp${p.hargaEceran.toLocaleString('id-ID')}`,
        `Rp${p.hargaReseller.toLocaleString('id-ID')}`,
        p.minOrderGrosir,
        p.deskripsi,
        p.komposisi,
        p.alergen,
        p.masaSimpan,
        p.momen,
        p.statusStok,
      ]
        .map(escapeCell)
        .join(',')
    ),
  ];

  return lines.join('\n');
}

export function exportRepackingReportCsv(
  productName: string,
  batchWeight: number,
  shrinkage: number,
  netYield: number,
  totalBatchCost: number,
  costPerGram: number,
  repackRows: RepackResult[],
  simulations: ChannelSimulationResult[]
): string {
  const escapeCell = (val: any) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const lines: string[] = [
    escapeCell('LAPORAN KALKULASI HPP & REPACKING — KRIUKMETRICS'),
    `${escapeCell('Produk')},${escapeCell(productName)}`,
    `${escapeCell('Berat Batch Mentah (g)')},${escapeCell(batchWeight)}`,
    `${escapeCell('Penyusutan (%)')},${escapeCell(shrinkage + '%')}`,
    `${escapeCell('Hasil Bersih Matang (g)')},${escapeCell(netYield)}`,
    `${escapeCell('Total Modal 1 Batch (Rp)')},${escapeCell('Rp ' + totalBatchCost.toLocaleString('id-ID'))}`,
    `${escapeCell('HPP Matang per Gram (Rp)')},${escapeCell('Rp ' + costPerGram.toFixed(2))}`,
    '',
    escapeCell('MATRIKS REPACKING PER UKURAN KEMASAN'),
    [
      'Ukuran Kemasan',
      'Pcs / Batch',
      'HPP Bahan (Rp)',
      'Biaya Kemasan (Rp)',
      'Total HPP/Pcs (Rp)',
      'Harga Jual Ecer (Rp)',
      'Laba Bersih/Pcs (Rp)',
      'Margin (%)',
      'Markup (%)',
      'Status Margin',
    ]
      .map(escapeCell)
      .join(','),
    ...repackRows.map((r) =>
      [
        r.label,
        r.pcsProduced,
        r.rawMaterialHppPerPcs,
        r.packagingCostPerPcs,
        r.totalHppPerPcs,
        r.retailPrice,
        r.netProfitPerPcs,
        `${r.marginPercent}%`,
        `${r.markupPercent}%`,
        r.healthStatus === 'healthy' ? 'Sehat' : r.healthStatus === 'warning' ? 'Tipis' : 'Kritis',
      ]
        .map(escapeCell)
        .join(',')
    ),
    '',
    escapeCell('SIMULASI PERBANDINGAN JALUR PENJUALAN'),
    [
      'Jalur Penjualan',
      'Harga Jual/Pcs (Rp)',
      'Qty Simulasi',
      'Omzet Kotor (Rp)',
      'Potongan Biaya (Rp)',
      'Potongan (%)',
      'Total Modal HPP (Rp)',
      'Laba Bersih Diterima (Rp)',
      'Margin Bersih (%)',
    ]
      .map(escapeCell)
      .join(','),
    ...simulations.map((s) =>
      [
        s.channelName,
        s.sellingPricePerUnit,
        s.totalQuantity,
        s.grossRevenue,
        s.channelDeductionsTotal,
        `${s.channelDeductionPercent}%`,
        s.totalHppCost,
        s.netProfitReceived,
        `${s.netMarginPercent}%`,
      ]
        .map(escapeCell)
        .join(',')
    ),
  ];

  return lines.join('\n');
}

export function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
