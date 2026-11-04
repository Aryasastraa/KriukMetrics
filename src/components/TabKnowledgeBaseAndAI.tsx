import React, { useState } from 'react';
import {
  ProductItem,
  BatchParameters,
  RepackResult,
  ChatMessage,
  ResellerMarketplaceParams,
} from '../types/snacks';
import { formatRupiah } from '../utils/calculator';
import { exportCatalogToCsv, downloadCsvFile } from '../utils/csvParser';
import {
  Send,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Search,
  Download,
  RotateCcw,
  Copy,
  CheckCheck,
} from 'lucide-react';

interface TabKnowledgeBaseAndAIProps {
  products: ProductItem[];
  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  batch: BatchParameters;
  repackRows: RepackResult[];
  resellerParams: ResellerMarketplaceParams;
  onResetProductsToDefault: () => void;
}

export const TabKnowledgeBaseAndAI: React.FC<TabKnowledgeBaseAndAIProps> = ({
  products,
  setProducts,
  batch,
  repackRows,
  resellerParams,
  onResetProductsToDefault,
}) => {
  // Knowledge Base State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<ProductItem>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<ProductItem>>({
    nama: '',
    kategori: 'Kacang-kacangan',
    varianRasa: 'Original',
    ukuranDefaultGram: 250,
    hargaEceran: 20000,
    hargaReseller: 17000,
    minOrderGrosir: 10,
    masaSimpan: '6 Bulan',
    alergen: 'Tidak ada',
    deskripsi: '',
    komposisi: '',
    statusStok: 'Tersedia',
  });

  // AI Consultant Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Halo! Saya siap menganalisis margin, komisi marketplace, dan simulasi paket bundling untuk ${products.length} produk Anda. Pilih tombol audit di atas atau ketik pertanyaan langsung.`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter products for left panel table
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.varianRasa.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'Semua' || p.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Semua', ...Array.from(new Set(products.map((p) => p.kategori)))];

  // Inline edit handlers
  const handleStartEdit = (p: ProductItem) => {
    setEditingId(p.id);
    setEditFormData({ ...p });
  };

  const handleSaveEdit = (id: string) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? ({ ...item, ...editFormData } as ProductItem) : item))
    );
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditFormData({});
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm(`Yakin ingin menghapus produk ${id}?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleAddNewProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nama) {
      alert('Nama produk wajib diisi.');
      return;
    }
    const newId = `PRD-${String(products.length + 1).padStart(3, '0')}`;
    const fullProduct: ProductItem = {
      id: newId,
      nama: newProduct.nama || 'Produk Baru',
      kategori: newProduct.kategori || 'Camilan',
      varianRasa: newProduct.varianRasa || 'Original',
      ukuranDefaultGram: Number(newProduct.ukuranDefaultGram) || 200,
      hargaEceran: Number(newProduct.hargaEceran) || 15000,
      hargaReseller: Number(newProduct.hargaReseller) || 12000,
      minOrderGrosir: Number(newProduct.minOrderGrosir) || 10,
      deskripsi: newProduct.deskripsi || '',
      komposisi: newProduct.komposisi || '',
      alergen: newProduct.alergen || 'Tidak ada',
      masaSimpan: newProduct.masaSimpan || '6 Bulan',
      momen: newProduct.momen || 'Camilan Keluarga',
      statusStok: (newProduct.statusStok as any) || 'Tersedia',
    };
    setProducts((prev) => [fullProduct, ...prev]);
    setShowAddModal(false);
    setNewProduct({
      nama: '',
      kategori: 'Kacang-kacangan',
      varianRasa: 'Original',
      ukuranDefaultGram: 250,
      hargaEceran: 20000,
      hargaReseller: 17000,
      minOrderGrosir: 10,
      masaSimpan: '6 Bulan',
      alergen: 'Tidak ada',
      statusStok: 'Tersedia',
    });
  };

  // AI Chat Request Handler
  const sendPromptToAi = async (promptText: string) => {
    if (!promptText.trim() || isLoadingAi) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsLoadingAi(true);

    try {
      // Build context for AI grounding
      const calculationContext = {
        batchProduksi: batch,
        repackMatrix: repackRows,
        resellerMarketplaceSettings: resellerParams,
      };

      const catalogContext = products.map((p) => ({
        id: p.id,
        nama: p.nama,
        kategori: p.kategori,
        varianRasa: p.varianRasa,
        gramasi: p.ukuranDefaultGram,
        hargaEceran: p.hargaEceran,
        hargaReseller: p.hargaReseller,
        minOrderGrosir: p.minOrderGrosir,
        masaSimpan: p.masaSimpan,
        alergen: p.alergen,
        statusStok: p.statusStok,
      }));

      const res = await fetch('/api/ai-consultant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: promptText,
          currentCalculation: calculationContext,
          catalogContext,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.text || 'Tidak ada respon yang diterima.',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('AI chat failed:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Mohon maaf, terjadi kendala saat menghubungi AI Consultant: ${err.message}. Pastikan API Key Gemini terhubung di sistem.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simple Markdown renderer for crisp output
  const renderFormattedMarkdown = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} className="font-semibold text-stone-900 text-sm mt-3 mb-1">
            {line.replace('### ', '')}
          </h4>
        );
      }
      // Header 2
      if (line.startsWith('## ')) {
        return (
          <h3 key={idx} className="font-semibold text-stone-900 text-sm mt-4 mb-1.5 pb-1 border-b border-stone-200">
            {line.replace('## ', '')}
          </h3>
        );
      }
      // Bullet items
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const text = line.substring(2);
        return (
          <li key={idx} className="ml-4 list-disc text-stone-700 text-xs my-0.5 leading-relaxed">
            {formatBoldText(text)}
          </li>
        );
      }
      // Numbered items
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="text-stone-700 text-xs my-1 font-medium leading-relaxed">
            {formatBoldText(line)}
          </div>
        );
      }
      // Table row (simple detection)
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim());
        if (cells.every((c) => c.startsWith('---') || c.startsWith(':--'))) {
          return null; // separator row
        }
        return (
          <div key={idx} className="grid grid-flow-col auto-cols-fr gap-2 py-1 px-2 border-b border-stone-100 font-mono text-[11px] bg-stone-50/50">
            {cells.map((cell, cIdx) => (
              <span key={cIdx} className="truncate">{cell}</span>
            ))}
          </div>
        );
      }
      // Empty line
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      // Standard line
      return (
        <p key={idx} className="text-stone-700 text-xs leading-relaxed my-1">
          {formatBoldText(line)}
        </p>
      );
    });
  };

  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-stone-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-stone-900">
            Konsultan AI & Katalog
          </h2>
          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded border border-emerald-200 bg-emerald-50 text-emerald-700 font-mono">
            Aktif
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              const csv = exportCatalogToCsv(products);
              downloadCsvFile(`Katalog_KnowledgeBase_${Date.now()}.csv`, csv);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors duration-150"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />
            <span>Unduh CSV</span>
          </button>
          <button
            type="button"
            onClick={onResetProductsToDefault}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors duration-150"
            title="Reset ke 18 produk default"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" strokeWidth={1.5} />
            <span>Reset (18)</span>
          </button>
        </div>
      </div>

      {/* Split View Bento Grid: Left 5 Cols, Right 7 Cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ============================================================== */}
        {/* PANEL KIRI: Knowledge Base Data Toko Aktif (5 Kolom) */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-3.5">
          <div className="bg-white border border-stone-200 rounded-lg p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">
                Katalog Toko ({products.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-stone-900 text-white hover:bg-stone-800 transition-colors duration-150"
              >
                <Plus className="w-3 h-3" strokeWidth={1.5} />
                <span>Tambah</span>
              </button>
            </div>

            {/* Search and Category Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" strokeWidth={1.5} />
                <input
                  type="text"
                  placeholder="Cari camilan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-stone-200 rounded-md bg-stone-50 focus:bg-white focus:outline-none focus:border-stone-400"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-1 text-xs">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors duration-150 ${
                      selectedCategory === cat
                        ? 'bg-stone-900 text-white font-medium'
                        : 'bg-stone-100 text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Knowledge Base Products Scrollable List */}
            <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const isEditing = editingId === p.id;

                if (isEditing) {
                  return (
                    <div
                      key={p.id}
                      className="p-3 bg-stone-50 border border-stone-300 rounded-md space-y-2 text-xs"
                    >
                      <div className="flex justify-between items-center font-mono font-semibold text-stone-900">
                        <span>Edit {p.id}</span>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(p.id)}
                            className="p-1 text-emerald-700 hover:bg-emerald-100 rounded"
                            title="Simpan"
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="p-1 text-stone-500 hover:bg-stone-200 rounded"
                            title="Batal"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          value={editFormData.nama || ''}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, nama: e.target.value })
                          }
                          className="w-full px-2 py-1 text-xs border border-stone-200 rounded bg-white"
                          placeholder="Nama produk"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-stone-500">Eceran (Rp)</label>
                          <input
                            type="number"
                            value={editFormData.hargaEceran || ''}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                hargaEceran: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 text-xs font-mono border border-stone-200 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-500">Reseller (Rp)</label>
                          <input
                            type="number"
                            value={editFormData.hargaReseller || ''}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                hargaReseller: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 text-xs font-mono border border-stone-200 rounded bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-stone-500">MOQ (pcs)</label>
                          <input
                            type="number"
                            value={editFormData.minOrderGrosir || ''}
                            onChange={(e) =>
                              setEditFormData({
                                ...editFormData,
                                minOrderGrosir: Number(e.target.value) || 0,
                              })
                            }
                            className="w-full px-2 py-1 text-xs font-mono border border-stone-200 rounded bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-500">Masa Simpan</label>
                          <input
                            type="text"
                            value={editFormData.masaSimpan || ''}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, masaSimpan: e.target.value })
                            }
                            className="w-full px-2 py-1 text-xs border border-stone-200 rounded bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={p.id}
                    className="p-2.5 bg-stone-50 border border-stone-200 rounded-md hover:border-stone-300 transition-colors duration-150 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-semibold text-stone-500 bg-stone-200 px-1 py-0.2 rounded">
                            {p.id}
                          </span>
                          <span className="text-xs font-semibold text-stone-900">{p.nama}</span>
                        </div>
                        <p className="text-[11px] text-stone-500">
                          {p.kategori} • {p.ukuranDefaultGram}g
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded transition-colors duration-150"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors duration-150"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 font-mono text-[11px]">
                      <span>Ecer: <strong className="text-stone-900">{formatRupiah(p.hargaEceran)}</strong></span>
                      <span>Grosir (≥{p.minOrderGrosir}): <strong className="text-emerald-700">{formatRupiah(p.hargaReseller)}</strong></span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-500">
                      <span>Simpan: {p.masaSimpan}</span>
                      <span>Alergen: {p.alergen}</span>
                    </div>
                  </div>
                );
              })}

              {filteredProducts.length === 0 && (
                <div className="p-4 text-center text-xs text-stone-400">
                  Tidak ada produk ditemukan.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PANEL KANAN: AI Diagnostic & Chat Consultant (7 Kolom) */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* 1-CLICK QUICK AI AUDIT BUTTONS */}
          <div className="bg-white border border-stone-200 rounded-lg p-3 sm:p-3.5 space-y-2">
            <span className="text-xs font-semibold text-stone-700 block">
              Pilihan Audit Cepat:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() =>
                  sendPromptToAi(
                    `Lakukan Audit Risiko Margin Marketplace untuk ${batch.productName} pada seluruh ukuran kemasan. Analisis apakah potongan admin (${resellerParams.marketplaceAdminPercent}%) + gratis ongkir (${resellerParams.marketplaceFreeShippingPercent}%) membuat margin turun di bawah 15%. Berikan rekomendasi angka harga listing baru per ukuran dalam Rupiah presisi agar margin bersih UMKM tetap aman di angka 25% - 30%.`
                  )
                }
                disabled={isLoadingAi}
                className="px-2.5 py-2 text-center sm:text-left border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 rounded-md transition-colors duration-150"
              >
                <span className="text-xs font-semibold text-stone-900 block">
                  1. Cek Untung Shopee
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  sendPromptToAi(
                    `Racik 3 Paket Bundling Hemat Camilan (Paket Rp 50.000, Paket Rp 100.000, dan Paket Rp 150.000) menggunakan produk-produk dari katalog Knowledge Base toko saat ini. Syarat wajib: setiap paket harus memiliki Margin Minimal 30%, perhitungkan masa simpan (jangan campur produk expired pendek jika untuk oleh-oleh), serta hitung rincian HPP, harga paket, keuntungan bersih UMKM, dan penghematan untuk pembeli.`
                  )
                }
                disabled={isLoadingAi}
                className="px-2.5 py-2 text-center sm:text-left border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 rounded-md transition-colors duration-150"
              >
                <span className="text-xs font-semibold text-stone-900 block">
                  2. Buat Paket Bundling
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  sendPromptToAi(
                    `Buatkan simulasi proposal keuntungan untuk Calon Reseller Baru jika mereka mengambil 10 Kg Camilan Campur (mix 4-5 produk terlaris dari katalog). Hitung modal yang harus dikeluarkan reseller, potensi omzet jika mereka menjual di harga eceran toko, keuntungan bersih yang didapat reseller, dan keuntungan bersih yang diterima oleh pemilik UMKM.`
                  )
                }
                disabled={isLoadingAi}
                className="px-2.5 py-2 text-center sm:text-left border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-stone-100 rounded-md transition-colors duration-150"
              >
                <span className="text-xs font-semibold text-stone-900 block">
                  3. Reseller Ambil 10 Kg
                </span>
              </button>
            </div>
          </div>

          {/* CHAT THREAD VIEW */}
          <div className="bg-white border border-stone-200 rounded-lg flex flex-col h-[440px] sm:h-[490px]">
            {/* Messages Scroll Area */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5">
              {chatMessages.map((msg) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAssistant ? 'items-start' : 'items-end'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-stone-400">
                      <span>{isAssistant ? 'KriukMetrics AI' : 'Anda'}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div
                      className={`relative max-w-[95%] sm:max-w-[88%] p-3 rounded-lg text-xs ${
                        isAssistant
                          ? 'bg-stone-50 border border-stone-200 text-stone-900'
                          : 'bg-stone-900 text-white'
                      }`}
                    >
                      {isAssistant ? (
                        <>
                          <div className="space-y-1">{renderFormattedMarkdown(msg.text)}</div>
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="absolute top-2 right-2 p-1 text-stone-400 hover:text-stone-700 rounded transition-colors duration-150"
                            title="Salin"
                          >
                            {copiedId === msg.id ? (
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {isLoadingAi && (
                <div className="flex items-start gap-2">
                  <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
                    <span>Menganalisis data...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="p-2.5 border-t border-stone-200 bg-stone-50 rounded-b-lg">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendPromptToAi(chatInput);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Tanyakan strategi harga, bundling, atau HPP..."
                  disabled={isLoadingAi}
                  className="flex-1 px-3 py-1.5 text-xs border border-stone-200 rounded-md bg-white text-stone-900 focus:outline-none focus:border-stone-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isLoadingAi}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors duration-150 flex items-center gap-1.5"
                >
                  <span>Kirim</span>
                  <Send className="w-3 h-3" strokeWidth={1.5} />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Tambah Produk Baru ke Knowledge Base */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-lg max-w-md w-full p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="text-sm font-semibold text-stone-900">
                Tambah Produk Baru ke Knowledge Base
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleAddNewProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-medium mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={newProduct.nama}
                  onChange={(e) => setNewProduct({ ...newProduct, nama: e.target.value })}
                  placeholder="Contoh: Makaroni Pedas Jeruk"
                  className="w-full px-2.5 py-1.5 border border-stone-200 rounded bg-stone-50 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Kategori</label>
                  <input
                    type="text"
                    value={newProduct.kategori}
                    onChange={(e) => setNewProduct({ ...newProduct, kategori: e.target.value })}
                    placeholder="Snack Krispi"
                    className="w-full px-2.5 py-1.5 border border-stone-200 rounded bg-stone-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Varian Rasa</label>
                  <input
                    type="text"
                    value={newProduct.varianRasa}
                    onChange={(e) => setNewProduct({ ...newProduct, varianRasa: e.target.value })}
                    placeholder="Pedas Daun Jeruk"
                    className="w-full px-2.5 py-1.5 border border-stone-200 rounded bg-stone-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Ukuran (g)</label>
                  <input
                    type="number"
                    value={newProduct.ukuranDefaultGram}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, ukuranDefaultGram: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 font-mono border border-stone-200 rounded bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Eceran (Rp)</label>
                  <input
                    type="number"
                    value={newProduct.hargaEceran}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, hargaEceran: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 font-mono border border-stone-200 rounded bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Reseller (Rp)</label>
                  <input
                    type="number"
                    value={newProduct.hargaReseller}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, hargaReseller: Number(e.target.value) })
                    }
                    className="w-full px-2 py-1.5 font-mono border border-stone-200 rounded bg-stone-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Masa Simpan</label>
                  <input
                    type="text"
                    value={newProduct.masaSimpan}
                    onChange={(e) => setNewProduct({ ...newProduct, masaSimpan: e.target.value })}
                    placeholder="6 Bulan"
                    className="w-full px-2.5 py-1.5 border border-stone-200 rounded bg-stone-50"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Min. Order Grosir</label>
                  <input
                    type="number"
                    value={newProduct.minOrderGrosir}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, minOrderGrosir: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-1.5 font-mono border border-stone-200 rounded bg-stone-50"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-stone-900 text-white hover:bg-stone-800 font-medium"
                >
                  Simpan ke Knowledge Base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
