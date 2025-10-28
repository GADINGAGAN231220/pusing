// src/hooks/usePemesanan.ts

import { useState, useMemo, useCallback } from 'react'; // Hapus useEffect dan useCallback yang tidak terpakai
// Import fungsi toast yang sebenarnya dari shadcn/ui
import { toast as showToast } from '@/components/ui/use-toast';

// --- TIPE DATA DARI pemesanandashboard.tsx ---
interface KonsumsiItem {
  id: string;
  jenis: string;
  qty: string;
  satuan: string; // Tambahkan satuan di sini jika ada di form
}
type Status = 'Menunggu' | 'Disetujui' | 'Ditolak' | 'Selesai'; // Tambahkan 'Selesai'

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
  tamu: 'standar' | 'reguler' | 'perta' | 'vip' | 'vvip'; // Sesuaikan tipe tamu jika perlu
  yangMengajukan: string;
  untukBagian: string;
  approval: string;
  status: Status;
  konsumsi: Konsumsi[];
  catatan?: string;
  statusHistory: StatusHistoryItem[];
  createdAt: number; // Gunakan number untuk sorting lebih mudah
}

// Tipe untuk data yang diterima dari form
interface FormValues {
  acara: string;
  tanggalPermintaan: string; // Mungkin tidak perlu jika selalu hari ini
  tanggalPengiriman: string;
  waktu: string;
  jamPengiriman: string;
  lokasi: string;
  tamu: 'standar' | 'reguler' | 'perta' | 'vip' | 'vvip'; // Sesuaikan tipe tamu jika perlu
  yangMengajukan: string;
  untukBagian: string;
  approval: string;
  konsumsi: KonsumsiItem[]; // Gunakan KonsumsiItem yang sudah didefinisikan
  catatan: string;
}


// Dummy data
const getCurrentDateFormatted = () => new Date().toISOString().slice(0, 10);
// const getYesterdayDateFormatted = () => { // Tidak terpakai
//   const d = new Date();
//   d.setDate(d.getDate() - 1);
//   return d.toISOString().slice(0, 10);
// };
const getNowTimestamp = () => new Date().toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
}).replace(/\./g, ':'); // Format lebih konsisten

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
   // Tambahkan contoh data dengan status Selesai dan Ditolak jika perlu untuk pengujian
   {
    id: 'ORD003',
    acara: 'Pelatihan Karyawan Baru',
    tanggal: '2025-10-25', // Contoh tanggal lampau
    waktu: 'Siang',
    jamPengiriman: '12:00',
    lokasi: 'Aula Serbaguna',
    tamu: 'reguler',
    yangMengajukan: 'HR Department',
    untukBagian: 'SDM',
    approval: 'Manager SDM',
    status: 'Selesai',
    konsumsi: [
        { jenis: 'Nasi Box Reguler', qty: 50, satuan: 'Box' },
    ],
    catatan: 'Sudah selesai dilaksanakan.',
    statusHistory: [
        { timestamp: '20/10/2025 10:00:00', status: 'Menunggu', oleh: 'HR Staff' },
        { timestamp: '20/10/2025 11:30:00', status: 'Disetujui', oleh: 'Manager SDM' },
        { timestamp: '25/10/2025 13:00:00', status: 'Selesai', oleh: 'Admin Sistem' },
    ],
    createdAt: Date.parse('2025-10-20T10:00:00Z'), // Gunakan timestamp number
  },
  {
    id: 'ORD004',
    acara: 'Rapat Anggaran Tahunan',
    tanggal: '2025-11-01',
    waktu: 'Pagi',
    jamPengiriman: '09:00',
    lokasi: 'Ruang Direksi',
    tamu: 'vvip',
    yangMengajukan: 'Sekretaris Direksi',
    untukBagian: 'Direksi',
    approval: 'Direktur Utama',
    status: 'Ditolak',
    konsumsi: [
        { jenis: 'Snack VVIP (High Tea)', qty: 5, satuan: 'Set' },
    ],
    catatan: 'Ditolak karena bentrok dengan jadwal lain.',
    statusHistory: [
        { timestamp: '28/10/2025 15:00:00', status: 'Menunggu', oleh: 'Sekretaris Direksi' },
        { timestamp: '28/10/2025 16:00:00', status: 'Ditolak', oleh: 'Direktur Utama' },
    ],
    createdAt: Date.parse('2025-10-28T15:00:00Z'), // Gunakan timestamp number
  },
];


// --- HOOK UTAMA usePemesanan ---
export const usePemesanan = () => {
  const [pemesananData, setPemesananData] = useState<Pemesanan[]>(initialPemesananList);
  const [searchDate, setSearchDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | Status | 'Aktif'>('Aktif'); // Tambah 'Aktif'
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
      // Cari ID numerik tertinggi saat ini
      const maxNum = pemesananData.reduce((max, item) => {
          const numPart = item.id.split('ORD')[1];
          const num = parseInt(numPart, 10);
          return !isNaN(num) && num > max ? num : max;
      }, 0);
      const nextNum = maxNum + 1;
      return `ORD${String(nextNum).padStart(3, '0')}`;
  }

  // Action: Menambahkan Pesanan Baru dari Form
  const addOrder = (values: FormValues) => {
    setIsLoading(true);
    setTimeout(() => {
        // Mapping KonsumsiItem dari form ke Konsumsi
        const newKonsumsi: Konsumsi[] = values.konsumsi.map(k => ({
            jenis: k.jenis, // Jenis sudah ada dari form sekarang
            qty: parseInt(k.qty, 10) || 0, // Pastikan jadi angka, default 0 jika gagal
            satuan: k.satuan, // Satuan sudah ada dari form
        }));

        // Membuat objek Pemesanan baru
        const newPemesanan: Pemesanan = {
            id: generateNewId(),
            acara: values.acara,
            tanggal: values.tanggalPengiriman, // Gunakan tanggal pengiriman
            waktu: values.waktu,
            jamPengiriman: values.jamPengiriman || '--:--', // Beri default jika kosong
            lokasi: values.lokasi,
            tamu: values.tamu,
            yangMengajukan: values.yangMengajukan,
            untukBagian: values.untukBagian,
            approval: values.approval,
            status: 'Menunggu', // Status awal selalu 'Menunggu'
            konsumsi: newKonsumsi,
            catatan: values.catatan || undefined, // Jadikan undefined jika kosong
            statusHistory: [{
                timestamp: getNowTimestamp(),
                status: 'Menunggu',
                oleh: values.yangMengajukan // Bisa diparsing namanya saja jika perlu
            }],
            createdAt: Date.now(), // Timestamp number saat dibuat
        };

        // Tambahkan ke state (di awal array agar muncul paling atas jika sort 'Terbaru')
        setPemesananData(prev => [newPemesanan, ...prev]);
        setIsLoading(false);
        fireToast('Pesanan Terkirim', `Pesanan "${newPemesanan.acara}" (${newPemesanan.id}) berhasil diajukan.`, 'default');
    }, 500); // Simulasi delay API
  };

  // Action: Memperbarui Status (Setuju/Tolak)
  const updateOrderStatus = (id: string, newStatus: 'Disetujui' | 'Ditolak') => {
    setIsLoading(true);
    setTimeout(() => {
      let updatedAcara = '';
      setPemesananData(prevData =>
        prevData.map(item => {
          if (item.id === id && (item.status === 'Menunggu' || item.status === 'Disetujui')) { // Hanya bisa diubah jika Menunggu/Disetujui
            updatedAcara = item.acara;
            const newHistoryItem: StatusHistoryItem = {
              timestamp: getNowTimestamp(),
              status: newStatus,
              oleh: 'Admin/Approver', // TODO: Idealnya nama user yang login
            };
            return {
              ...item,
              status: newStatus,
              // Pastikan statusHistory adalah array sebelum spread
              statusHistory: [...(Array.isArray(item.statusHistory) ? item.statusHistory : []), newHistoryItem],
            };
          }
          return item;
        })
      );
      setIsLoading(false);
      if (updatedAcara) {
          fireToast('Status Diperbarui', `Pesanan ${updatedAcara} (${id}) diubah menjadi: ${newStatus}.`, newStatus === 'Disetujui' ? 'default' : 'destructive');
      } else {
          fireToast('Gagal', `Status pesanan (${id}) tidak dapat diubah.`, 'destructive');
      }
    }, 500);
  };

   // Action: Menandai Selesai
   const markAsDone = useCallback((id: string) => {
    setIsLoading(true);
    setTimeout(() => {
      let updatedAcara = '';
      setPemesananData(prevList => prevList.map(item => {
        if (item.id === id && item.status === 'Disetujui') { // Hanya bisa selesai jika sudah disetujui
            updatedAcara = item.acara; // Simpan nama acara
            const newStatus: Status = 'Selesai';
            const newHistory: StatusHistoryItem = {
                status: newStatus,
                timestamp: getNowTimestamp(),
                oleh: 'Admin/Sistem' // Bisa juga user yang menandai
            };
            // Pastikan statusHistory adalah array
            const currentHistory = Array.isArray(item.statusHistory) ? item.statusHistory : [];
            return {
                ...item,
                status: newStatus,
                statusHistory: [...currentHistory, newHistory],
                // updatedAt: new Date().toISOString(), // Jika perlu field updatedAt
            };
        }
        return item;
      }));
      setIsLoading(false);
      // Tampilkan toast berdasarkan apakah ada acara yang diupdate
      if (updatedAcara) {
          fireToast('Pesanan Selesai', `Pesanan ${updatedAcara} (${id}) ditandai selesai.`, 'default');
      } else {
          // Mungkin beri tahu user kenapa gagal (misal status bukan 'Disetujui')
          const currentItem = pemesananData.find(item => item.id === id);
          const reason = currentItem ? `Status saat ini: ${currentItem.status}` : 'Pesanan tidak ditemukan';
          fireToast('Gagal', `Pesanan (${id}) tidak dapat ditandai selesai. ${reason}`, 'destructive');
      }
    }, 500); // Simulasi delay
  }, [pemesananData]); // Tambahkan dependensi jika diperlukan


  // Action: Menghapus Pesanan
  const deleteOrder = (id: string, acara: string) => {
    // Sebaiknya ada konfirmasi di UI sebelum memanggil ini
    setIsLoading(true);
    setTimeout(() => {
      setPemesananData(prevData => prevData.filter(item => item.id !== id));
      setIsLoading(false);
      fireToast('Pesanan Dihapus', `Pesanan "${acara}" (${id}) berhasil dihapus.`, 'destructive');
    }, 500);
  };

  // Action: Export CSV
  const exportCSV = () => {
    if (filteredAndSortedRiwayat.length === 0) {
        fireToast('Export Gagal', 'Tidak ada data untuk diekspor.', 'destructive');
        return;
    }
    const header = [
      'ID', 'Acara', 'Tanggal Pengiriman', 'Waktu', 'Jam Kirim', 'Lokasi', 'Jenis Tamu',
      'Pengaju', 'Untuk Bagian', 'Approval', 'Status', 'Konsumsi',
      'Catatan', 'Dibuat Pada (Timestamp)'
    ];

    const csvContent = filteredAndSortedRiwayat.map(item => {
      const konsumsiStr = item.konsumsi.map(k => `${k.jenis} (${k.qty} ${k.satuan})`).join('; ');
      // Fungsi untuk escape string CSV
      const escapeCSV = (str: string | undefined | null): string => {
        if (str === null || str === undefined) return '""';
        const stringVal = String(str);
        // Jika mengandung koma, kutip ganda, atau newline, bungkus dengan kutip ganda
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          // Kutip ganda di dalam string digandakan
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return `"${stringVal}"`; // Selalu bungkus dengan kutip untuk konsistensi
      };

      return [
        escapeCSV(item.id),
        escapeCSV(item.acara),
        escapeCSV(item.tanggal),
        escapeCSV(item.waktu),
        escapeCSV(item.jamPengiriman),
        escapeCSV(item.lokasi),
        escapeCSV(item.tamu),
        escapeCSV(item.yangMengajukan),
        escapeCSV(item.untukBagian),
        escapeCSV(item.approval),
        escapeCSV(item.status),
        escapeCSV(konsumsiStr),
        escapeCSV(item.catatan),
        escapeCSV(new Date(item.createdAt).toLocaleString('id-ID')) // Format tanggal dibuat
      ].join(',');
    }).join('\n');

    const finalCsv = [header.join(','), csvContent].join('\n');

    const blob = new Blob([finalCsv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) { // Cek fitur download
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `riwayat_pemesanan_${getCurrentDateFormatted()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // Bersihkan URL object
        fireToast('Export Berhasil', 'Data pemesanan berhasil diekspor ke CSV.', 'default');
    } else {
        fireToast('Export Gagal', 'Browser Anda tidak mendukung fitur download.', 'destructive');
    }
  };

  // Filtering and Sorting Logic
  const filteredAndSortedRiwayat = useMemo(() => {
    let list = [...pemesananData];

    // Filter berdasarkan status
    if (filterStatus === 'Aktif') {
        list = list.filter(item => item.status === 'Menunggu' || item.status === 'Disetujui');
    } else if (filterStatus !== 'Semua') {
      list = list.filter(item => item.status === filterStatus);
    }

    // Filter berdasarkan tanggal (jika ada)
    if (searchDate) {
      list = list.filter(item => item.tanggal === searchDate);
    }

    // Sorting
    list.sort((a, b) => {
      // Pastikan createdAt adalah number
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : 0;
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : 0;

      if (sortOrder === 'Terbaru') {
        return timeB - timeA; // Terbaru duluan
      } else {
        return timeA - timeB; // Terlama duluan
      }
    });

    return list;
  }, [pemesananData, filterStatus, searchDate, sortOrder]);

  // Calculate Counts for StatCards
  const counts = useMemo(() => {
    // Inisialisasi count dengan semua status yang mungkin
    const initialCounts: Record<Status, number> = { Menunggu: 0, Disetujui: 0, Ditolak: 0, Selesai: 0 };
    return pemesananData.reduce((acc, item) => {
      // Pastikan status item ada di initialCounts sebelum increment
      if (item.status in acc) {
          acc[item.status]++;
      }
      return acc;
    }, initialCounts);
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
        markAsDone, // Tambahkan markAsDone ke actions
        deleteOrder,
        exportCSV,
        addOrder, // Pastikan addOrder diekspor
    },
  };
};

// Pastikan tipe data diekspor
export type { Pemesanan, Konsumsi, Status, StatusHistoryItem, FormValues, KonsumsiItem };

// Ekspor DUMMY_RIWAYAT tidak diperlukan lagi karena initial state sudah di dalam hook
// export const DUMMY_RIWAYAT = ...