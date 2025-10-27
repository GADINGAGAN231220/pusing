// src/hooks/usePemesanan.ts

import { useState, useMemo } from 'react'; // Hapus useEffect yang tidak terpakai
// Import fungsi toast yang sebenarnya dari shadcn/ui
import { toast as showToast } from '@/components/ui/use-toast'; 

// --- TIPE DATA DARI pemesanandashboard.tsx ---
interface KonsumsiItem {
  id: string; 
  jenis: string; 
  qty: string; 
}
type Status = 'Menunggu' | 'Disetujui' | 'Ditolak';

interface StatusHistoryItem {
  timestamp: string;
  status: Status;
  oleh: string; 
}

interface Konsumsi {
  jenis: string;
  qty: number;
  satuan: string;
}

interface Pemesanan {
  id: string;
  acara: string;
  tanggal: string; 
  waktu: string; 
  jamPengiriman: string; 
  lokasi: string;
  tamu: string; 
  yangMengajukan: string;
  untukBagian: string;
  approval: string;
  status: Status;
  konsumsi: Konsumsi[]; 
  catatan?: string;
  statusHistory: StatusHistoryItem[];
  createdAt: number; 
}

interface FormValues {
  acara: string;
  tanggalPermintaan: string;
  tanggalPengiriman: string;
  waktu: string;
  jamPengiriman: string;
  lokasi: string;
  tamu: string;
  yangMengajukan: string;
  untukBagian: string;
  approval: string;
  konsumsi: KonsumsiItem[];
  catatan: string;
}

// Dummy data
const getCurrentDateFormatted = () => new Date().toISOString().slice(0, 10);
const getYesterdayDateFormatted = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
};
const getNowTimestamp = () => new Date().toLocaleString('id-ID');

const initialPemesananList: Pemesanan[] = [
  {
    id: 'ORD001',
    acara: 'Rapat Koordinasi Mingguan',
    tanggal: getCurrentDateFormatted(),
    waktu: 'Pagi',
    jamPengiriman: '10:00',
    lokasi: 'Ruang Meeting Utama Lantai 3',
    tamu: 'standar', 
    yangMengajukan: 'Budi Santoso',
    untukBagian: 'Divisi Pemasaran',
    approval: 'Dewi Rahayu',
    status: 'Menunggu',
    konsumsi: [
      { jenis: 'Nasi Box Standar', qty: 30, satuan: 'Pcs' },
      { jenis: 'Air Mineral 600ml', qty: 30, satuan: 'Botol' },
    ],
    catatan: 'Permintaan teh manis hangat untuk 5 orang khusus.',
    statusHistory: [
      { timestamp: getNowTimestamp(), status: 'Menunggu', oleh: 'Sistem' },
    ],
    createdAt: Date.now() - 5000000,
  },
  {
    id: 'ORD002',
    acara: 'Kunjungan Mitra Internasional',
    tanggal: getCurrentDateFormatted(),
    waktu: 'Siang',
    jamPengiriman: '14:30',
    lokasi: 'Lounge Eksekutif',
    tamu: 'vip', 
    yangMengajukan: 'Siti Aminah',
    untukBagian: 'Divisi Hubungan Masyarakat',
    approval: 'Agus Salim',
    status: 'Disetujui',
    konsumsi: [
      { jenis: 'Snack Box Reguler', qty: 15, satuan: 'Box' },
      { jenis: 'Kopi & Teh (Sachet)', qty: 15, satuan: 'Set' },
    ],
    catatan: 'Harap sediakan makanan bebas gluten untuk satu tamu.',
    statusHistory: [
      { timestamp: getNowTimestamp(), status: 'Menunggu', oleh: 'Siti Aminah' },
      { timestamp: new Date(Date.now() - 100000).toLocaleString('id-ID'), status: 'Disetujui', oleh: 'Agus Salim' },
    ],
    createdAt: Date.now() - 10000000,
  },
];


// --- HOOK UTAMA usePemesanan ---
export const usePemesanan = () => {
  const [pemesananData, setPemesananData] = useState<Pemesanan[]>(initialPemesananList);
  const [searchDate, setSearchDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Menunggu' | 'Disetujui' | 'Ditolak'>('Semua');
  const [sortOrder, setSortOrder] = useState<'Terbaru' | 'Terlama'>('Terbaru');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Fungsi helper untuk memanggil toast dari shadcn/ui
  const fireToast = (title: string, description: string, variant: 'default' | 'destructive' = 'default') => {
    showToast({
      title,
      description,
      variant,
    });
  }

  const generateNewId = () => {
      const num = pemesananData.length + 1;
      return `ORD${String(num).padStart(3, '0')}`;
  }

  // Action: Menambahkan Pesanan Baru dari Form
  const addOrder = (values: FormValues) => {
    setIsLoading(true);
    setTimeout(() => {
        const newKonsumsi: Konsumsi[] = values.konsumsi.map(k => ({
            jenis: k.jenis,
            qty: parseInt(k.qty, 10),
            satuan: k.jenis.toLowerCase().includes('box') ? 'Box' : k.jenis.toLowerCase().includes('prasmanan') ? 'Porsi' : 'Pcs',
        }));

        const newPemesanan: Pemesanan = {
            id: generateNewId(),
            acara: values.acara,
            tanggal: values.tanggalPengiriman,
            waktu: values.waktu,
            jamPengiriman: values.jamPengiriman,
            lokasi: values.lokasi,
            tamu: values.tamu,
            yangMengajukan: values.yangMengajukan,
            untukBagian: values.untukBagian,
            approval: values.approval,
            status: 'Menunggu', 
            konsumsi: newKonsumsi,
            catatan: values.catatan,
            statusHistory: [{ 
                timestamp: getNowTimestamp(), 
                status: 'Menunggu', 
                oleh: values.yangMengajukan.split('(')[0].trim() 
            }],
            createdAt: Date.now(),
        };

        setPemesananData(prev => [newPemesanan, ...prev]);
        setIsLoading(false);
        fireToast('Pesanan Terkirim', `Pesanan untuk acara "${newPemesanan.acara}" berhasil diajukan.`, 'default');
    }, 500);
  };
  
  // Action: Memperbarui Status
  const updateOrderStatus = (id: string, newStatus: 'Disetujui' | 'Ditolak') => {
    setIsLoading(true);
    setTimeout(() => {
      let updatedAcara = '';
      setPemesananData(prevData =>
        prevData.map(item => {
          if (item.id === id) {
            updatedAcara = item.acara;
            const newHistoryItem: StatusHistoryItem = {
              timestamp: new Date().toLocaleString('id-ID'),
              status: newStatus,
              oleh: 'Admin Dashboard', 
            };
            return {
              ...item,
              status: newStatus,
              statusHistory: [...item.statusHistory, newHistoryItem],
            };
          }
          return item;
        })
      );
      setIsLoading(false);
      fireToast('Status Diperbarui', `Pesanan ${updatedAcara} (${id}) berhasil diperbarui menjadi: ${newStatus}.`, newStatus === 'Disetujui' ? 'default' : 'destructive');
    }, 500); 
  };

  // Action: Menghapus Pesanan
  const deleteOrder = (id: string, acara: string) => {
    setIsLoading(true);
    setTimeout(() => {
      setPemesananData(prevData => prevData.filter(item => item.id !== id));
      setIsLoading(false);
      fireToast('Pesanan Dihapus', `Pesanan ${acara} (${id}) berhasil dihapus.`, 'destructive');
    }, 500); 
  };

  // Action: Export CSV
  const exportCSV = () => {
    const header = [
      'ID', 'Acara', 'Tanggal', 'Waktu', 'Lokasi', 'Tamu', 
      'Pengaju', 'Bagian', 'Approval', 'Status', 'Konsumsi', 
      'Catatan', 'CreatedAt'
    ];
    
    const csvContent = pemesananData.map(item => {
      const konsumsiStr = item.konsumsi.map(k => `${k.jenis} (${k.qty} ${k.satuan})`).join('; ');
      return [
        item.id,
        item.acara,
        item.tanggal,
        item.waktu,
        item.lokasi,
        item.tamu,
        item.yangMengajukan,
        item.untukBagian,
        item.approval,
        item.status,
        `"${konsumsiStr}"`,
        `"${item.catatan || ''}"`,
        new Date(item.createdAt).toISOString()
      ].join(',');
    }).join('\n');
    
    const finalCsv = [header.join(','), csvContent].join('\n');
    
    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'riwayat_pemesanan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    fireToast('Export Berhasil', 'Data pemesanan berhasil diekspor ke CSV.', 'default');
  };
  
  // Filtering and Sorting Logic
  const filteredAndSortedRiwayat = useMemo(() => {
    let list = [...pemesananData];

    if (filterStatus !== 'Semua') {
      list = list.filter(item => item.status === filterStatus);
    }

    if (searchDate) {
      list = list.filter(item => item.tanggal === searchDate);
    }
    
    list.sort((a, b) => {
      if (sortOrder === 'Terbaru') {
        return b.createdAt - a.createdAt; 
      } else {
        return a.createdAt - b.createdAt; 
      }
    });

    return list;
  }, [pemesananData, filterStatus, searchDate, sortOrder]);
  
  // Calculate Counts for StatCards
  const counts = useMemo(() => {
    return pemesananData.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, { Menunggu: 0, Disetujui: 0, Ditolak: 0 });
  }, [pemesananData]);


  return {
    riwayat: pemesananData, 
    filteredAndSortedRiwayat, 
    counts,
    isLoading,
    searchDate,
    filterStatus,
    sortOrder,
    actions: {
        setSearchDate,
        setFilterStatus,
        setSortOrder,
        updateOrderStatus,
        deleteOrder,
        exportCSV,
        addOrder,
    },
  };
};

// Pastikan tipe data diekspor
export type { Pemesanan, Konsumsi, Status, StatusHistoryItem, FormValues };

// Ekspor dummy DUMMY_RIWAYAT untuk kompatibilitas form
export const DUMMY_RIWAYAT = initialPemesananList.map(r => ({
  ...r,
  tanggalPermintaan: getCurrentDateFormatted(),
  tanggalPengiriman: r.tanggal,
  waktu: r.waktu === '10:00' ? 'Pagi' : 'Siang', // Konversi balik untuk Form
  konsumsi: r.konsumsi.map(k => ({
    id: k.jenis.toLowerCase().includes('nasi box') ? 'std-nasi' : 'std-snack', // Dummy ID
    jenis: k.jenis,
    qty: String(k.qty),
  }))
}));