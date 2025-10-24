import * as z from "zod";

// Skema untuk satu item konsumsi
export const konsumsiItemSchema = z.object({
  jenis: z.string().min(1, "Menu wajib diisi"),
  satuan: z.string().min(1, "Satuan wajib diisi"),
  qty: z.string().refine((val) => /^\d+$/.test(val) && parseInt(val, 10) > 0, {
    message: "Qty > 0",
  }),
});

// Skema utama form, sekarang menggunakan array konsumsi
export const formSchema = z.object({
  acara: z.string().min(3, "Nama acara harus diisi (minimal 3 karakter)."),
  tanggal: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: "Tanggal harus valid.",
  }),
  lokasi: z.string().min(3, "Lokasi harus diisi (minimal 3 karakter)."),
  untukBagian: z.string().min(3, "Bagian harus dipilih."),
  approval: z.string().min(3, "Approval harus dipilih."),
  konsumsi: z.array(konsumsiItemSchema).min(1, "Minimal harus ada satu item konsumsi."),
  catatan: z.string().optional(),
});

// Tipe data Pemesanan berdasarkan skema Zod
export type Pemesanan = z.infer<typeof formSchema> & {
  id: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  createdAt: string;
};

