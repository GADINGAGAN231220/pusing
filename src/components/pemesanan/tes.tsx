import React, { useState, useMemo, useEffect, forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Impor hook form diperlukan DI SINI karena Form ada di file yang sama
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- UTILITY: Class Name Merger ---
function cn(...inputs) {
    const classes = new Set();
    inputs.forEach(arg => {
        if (!arg) return;
        if (typeof arg === 'string' || typeof arg === 'number') { classes.add(String(arg)); }
        else if (Array.isArray(arg)) { arg.forEach(c => c && classes.add(String(c))); }
        else if (typeof arg === 'object') { Object.keys(arg).forEach(key => arg[key] && classes.add(key)); }
    });
    return Array.from(classes).join(' ');
}

// --- FUNGSI HELPER TANGGAL ---
const getTodayDate = () => new Date().toISOString().split('T')[0];
const getTomorrowDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };


// --- TIPE DATA ---
export interface StatusHistoryItem {
  timestamp: string;
  status: string;
  oleh: string;
}

export interface KonsumsiItemForm { // Tipe untuk item di form (dengan id opsional)
    id?: string;
    jenis: string; // Nama disimpan di form untuk UI
    qty: string;
}

export interface KonsumsiItemData { // Tipe untuk item di data riwayat (hanya id & qty)
    id?: string;
    jenis: string; // Nama disimpan di data untuk ditampilkan di modal/detail
    qty: string;
}


export interface Pemesanan {
  id: string;
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
  konsumsi: KonsumsiItemData[]; // Gunakan tipe data
  catatan?: string;
  status: 'Menunggu' | 'Disetujui' | 'Ditolak';
  statusHistory: StatusHistoryItem[];
  [key: string]: any;
}

// --- DATA KONSUMSI MASTER ---
export const TINGKAT_TAMU = { 'standar': 1, 'reguler': 2, 'perta': 3, 'vip': 4, 'vvip': 5 };
export const MASTER_KONSUMSI = [
    { id: 'std-nasi', nama: 'Nasi Box Standar', tamuMinLevel: 1, allowedWaktu: ['Siang', 'Malam'], img: 'https://placehold.co/600x400/FFF0F0/FF6347?text=Nasi+Box+Std' },
    { id: 'std-snack', nama: 'Snack Box Standar', tamuMinLevel: 1, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/600x400/FFF5E1/FFA500?text=Snack+Box+Std' },
    { id: 'std-kopi', nama: 'Kopi & Teh (Sachet)', tamuMinLevel: 1, allowedWaktu: ['Pagi', 'Sore'], img: 'https://placehold.co/600x400/E6F7FF/1890FF?text=Kopi+Sachet' },
    { id: 'reg-nasi', nama: 'Nasi Box Reguler', tamuMinLevel: 2, allowedWaktu: ['Siang', 'Malam'], img: 'https://placehold.co/600x400/F0F5FF/40A9FF?text=Nasi+Box+Reg' },
    { id: 'reg-snack', nama: 'Snack Box Reguler', tamuMinLevel: 2, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/600x400/FFFBE6/FFC53D?text=Snack+Box+Reg' },
    { id: 'reg-prasmanan', nama: 'Prasmanan Reguler', tamuMinLevel: 2, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/600x400/F6FFED/73D13D?text=Prasmanan+Reg' },
    { id: 'perta-nasi', nama: 'Nasi Box Perta', tamuMinLevel: 3, allowedWaktu: ['Siang', 'Malam'], img: 'https://placehold.co/600x400/E6FFFB/13C2C2?text=Nasi+Box+Perta' },
    { id: 'perta-snack', nama: 'Snack Box Perta', tamuMinLevel: 3, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/600x400/FFF7E6/FF9C6E?text=Snack+Box+Perta' },
    { id: 'perta-prasmanan', nama: 'Prasmanan Perta', tamuMinLevel: 3, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/600x400/F9F0FF/9254DE?text=Prasmanan+Perta' },
    { id: 'vip-prasmanan', nama: 'Prasmanan VIP', tamuMinLevel: 4, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/600x400/FFF1F0/FF4D4F?text=Prasmanan+VIP' },
    { id: 'vip-snack', nama: 'Snack VIP (Coffee Break)', tamuMinLevel: 4, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/600x400/FFFFE0/FAAD14?text=Snack+VIP' },
    { id: 'vvip-prasmanan', nama: 'Prasmanan VVIP', tamuMinLevel: 5, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/600x400/FAFAFA/262626?text=Prasmanan+VVIP' },
    { id: 'vvip-snack', nama: 'Snack VVIP (High Tea)', tamuMinLevel: 5, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/600x400/E0E0E0/595959?text=Snack+VVIP' },
    { id: 'sp-sahur', nama: 'Menu Sahur Box', tamuMinLevel: 1, allowedWaktu: ['Sahur'], img: 'https://placehold.co/600x400/F3F3F3/8C8C8C?text=Sahur+Box' },
    { id: 'sp-takjil', nama: 'Paket Takjil', tamuMinLevel: 1, allowedWaktu: ['Buka Puasa'], img: 'https://placehold.co/600x400/FEFBE6/FADB14?text=Takjil' },
    { id: 'sp-bubur', nama: 'Bubur Ayam Pagi', tamuMinLevel: 2, allowedWaktu: ['Pagi'], img: 'https://placehold.co/600x400/FFF0F5/FF85C0?text=Bubur+Ayam' },
    { id: 'sp-buah', nama: 'Buah Potong Segar', tamuMinLevel: 2, allowedWaktu: ['Pagi', 'Siang', 'Sore', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/600x400/F6FFED/73D13D?text=Buah+Segar' },
];
export const getKonsumsiById = (id: string | undefined) => id ? MASTER_KONSUMSI.find(item => item.id === id) : undefined;


// --- SCHEMA DEFINITION (Untuk Form) ---
const isTomorrowOrLater = (dateString: string): boolean => { const today = new Date(); const selectedDate = new Date(dateString); today.setHours(0, 0, 0, 0); selectedDate.setHours(0, 0, 0, 0); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); return selectedDate >= tomorrow; };
const konsumsiItemFormSchema = z.object({ id: z.string().optional(), jenis: z.string().min(1, "Jenis harus dipilih."), qty: z.string().refine((val) => /^\d+$/.test(val) && parseInt(val, 10) > 0, { message: "Qty harus > 0." }), });
const formSchema = z.object({ acara: z.string().min(3, "Nama acara min 3 karakter."), tanggalPermintaan: z.string().refine(v => !isNaN(Date.parse(v)), "Tgl permintaan invalid."), tanggalPengiriman: z.string().refine(v => !isNaN(Date.parse(v)), "Tgl pengiriman invalid.").refine(isTomorrowOrLater, "Tgl pengiriman min H+1."), waktu: z.string().min(1, "Waktu harus dipilih."), jamPengiriman: z.string().min(1, "Jam harus diisi."), lokasi: z.string().min(3, "Lokasi min 3 karakter."), tamu: z.string().min(1, "Tamu harus dipilih."), yangMengajukan: z.string().min(3, "Pengaju harus dipilih."), untukBagian: z.string().min(3, "Bagian harus dipilih."), approval: z.string().min(3, "Approval harus dipilih."), konsumsi: z.array(konsumsiItemFormSchema).min(1, "Min 1 konsumsi."), catatan: z.string().optional(), });


// --- KOMPONEN UI, IKON, MODAL, TIMELINE (Definisikan semua di sini) ---

// Komponen UI Dasar
const Button = forwardRef(({ className, variant = 'default', size = 'default', ...props }: any, ref) => { const base = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transform"; const variants = { default: "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:scale-105", destructive: "bg-red-500 text-white hover:bg-red-600/90 hover:shadow-lg hover:scale-105", outline: "border border-slate-300 bg-white hover:bg-slate-100 hover:scale-105", secondary: "bg-slate-200 text-slate-800 hover:bg-slate-200/80 hover:scale-105", ghost: "hover:bg-slate-100 hover:scale-105" }; const sizes = { default: "h-10 py-2 px-4", sm: "h-9 px-3 rounded-md", lg: "h-11 px-8 rounded-md" }; return <button className={cn(base, variants[variant], sizes[size], className)} ref={ref} {...props} />; });
const Card = forwardRef(({ className, ...props }: any, ref) => <div ref={ref} className={cn("rounded-lg border bg-white text-slate-900 shadow-lg", className)} {...props} />);
// CardHeader DIBERI WARNA LATAR BELAKANG
const CardHeader = forwardRef(({ children, className, ...props }: any, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 bg-slate-50 border-b border-slate-200 rounded-t-lg", className)} {...props}>{children}</div>);
const CardTitle = forwardRef(({ className, children, ...props }: any, ref) => <h3 ref={ref} className={cn("text-xl font-semibold leading-none tracking-tight text-slate-800", className)} {...props}>{children}</h3>);
const CardDescription = forwardRef(({ className, ...props }: any, ref) => <p ref={ref} className={cn("text-sm text-slate-500", className)} {...props} />);
const CardContent = forwardRef(({ className, children, ...props }: any, ref) => <div ref={ref} className={cn("p-6 pt-6", className)} {...props}>{children}</div>);
const CardFooter = forwardRef(({ className, ...props }: any, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />);
const Input = forwardRef(({ className, error, ...props }: any, ref) => <input className={cn( "flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-70", error && "border-red-500 focus:ring-red-500", className )} ref={ref} {...props} />);
const Label = forwardRef(({ className, ...props }: any, ref) => <label ref={ref} className={cn("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-700", className)} {...props} />);

// Ikon
const CheckCircle2 = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>;
const ChevronDown = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>;
const SearchIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const Trash2 = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const Plus = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const Minus = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const CalendarDays = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>;
const UserCircle = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>;
const ClipboardList = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const FileText = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
const PlusCircle = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>;
const ClockIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const XCircleIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const Download = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>;
const Eye = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>;
const FileTextIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>;
const CalendarIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const MapPinIcon = ({className = ""}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>;
const ListIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>;
const GridIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>;
const XIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const AlertTriangleIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>;

// Komponen Form Step
const FormStep = ({ children, step, currentStep }) => { if (step !== currentStep) return null; return (<motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="mb-8">{children}</motion.div>); };

// Komponen Searchable Select
const SearchableSelect = ({ options = [], value, onChange, placeholder = "Pilih opsi...", error }) => { const [search, setSearch] = useState(""); const [isOpen, setIsOpen] = useState(false); const containerRef = useRef(null); const searchInputRef = useRef(null); const filteredOptions = useMemo(() => options.filter(opt => opt.label?.toLowerCase().includes(search.toLowerCase())), [options, search]); useEffect(() => { const handleClickOutside = (event) => { if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false); }; document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, []); useEffect(() => { if (isOpen && searchInputRef.current) searchInputRef.current.focus(); }, [isOpen]); const handleOptionClick = (val) => { onChange(val); setSearch(""); setIsOpen(false); }; const selectedLabel = options.find(opt => opt.value === value)?.label || ""; return ( <div className="relative w-full" ref={containerRef}> <button type="button" className={cn("flex h-10 w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500", !selectedLabel && "text-slate-500", error && "border-red-500 focus:ring-red-500")} onClick={() => setIsOpen(!isOpen)}> {selectedLabel || placeholder} <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} /> </button> {isOpen && ( <div className="absolute z-30 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"> {/* Increase z-index */} <div className="p-2"> <div className="relative"> <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" /> <input ref={searchInputRef} type="text" placeholder="Cari..." className="w-full rounded-md border border-gray-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={search} onChange={(e) => setSearch(e.target.value)} /> </div> </div> <div className="max-h-48 overflow-auto p-1"> {filteredOptions.length > 0 ? ( filteredOptions.map((option, index) => (<div key={index} onClick={() => handleOptionClick(option.value)} className={cn("cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-slate-100", value === option.value && "bg-slate-100 font-medium")}>{option.label}</div>))) : (<div className="px-4 py-2 text-sm text-center text-gray-500">Tidak ada hasil</div>)} </div> </div> )} </div> ); };

// Komponen Qty Stepper
const QtyStepper = ({ value, onChange, error }) => { const numValue = parseInt(value, 10) || 0; const handleIncrement = () => { onChange(String(numValue + 1)); }; const handleDecrement = () => { if (numValue > 1) onChange(String(numValue - 1)); }; return ( <div className={cn("flex items-center justify-between w-full h-10 rounded-md border border-slate-300 bg-white", error && "border-red-500")}> <Button type="button" variant="ghost" size="sm" className="h-full px-3 rounded-r-none border-r border-slate-300 text-slate-600 hover:bg-slate-100" onClick={handleDecrement} disabled={numValue <= 1}><Minus className="h-4 w-4" /></Button> <span className="flex-1 text-center text-sm font-medium text-slate-900">{numValue}</span> <Button type="button" variant="ghost" size="sm" className="h-full px-3 rounded-l-none border-l border-slate-300 text-slate-600 hover:bg-slate-100" onClick={handleIncrement}><Plus className="h-4 w-4" /></Button> </div> ); };

// Komponen Image Watcher
const KonsumsiImageWatcher = ({ control, index }) => { const itemId = useWatch({ control, name: `konsumsi.${index}.id` }); const itemData = getKonsumsiById(itemId); if (!itemData) return <div className="h-20 w-20 bg-slate-100 rounded-md flex items-center justify-center text-slate-400 text-xs text-center">Pilih Jenis</div>; return (<img src={itemData.img} alt={itemData.nama} className="h-20 w-20 rounded-md object-cover border border-slate-200" onError={(e: any) => e.target.src = 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=Error'} />); };

// Komponen StatCard
const StatCard = ({ icon, title, value, colorClass }) => ( <div className={`p-5 rounded-xl shadow-lg flex items-center space-x-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${colorClass}`}> <div className="flex-shrink-0 h-14 w-14 flex items-center justify-center"><div className="text-4xl opacity-90">{icon}</div></div> <div><p className="font-bold text-2xl">{value}</p><p className="text-sm uppercase font-semibold opacity-70 tracking-wider">{title}</p></div> </div> );

// Komponen Timeline Status
const StatusTimeline = ({ history = [] }: { history: StatusHistoryItem[] }) => ( <div className="mt-6"> <h4 className="font-semibold text-lg mb-4 text-gray-800">Status Order</h4> <div className="relative border-l-2 border-slate-200 ml-3"> {history.length > 0 ? ( history.map((item, index) => ( <div key={index} className="mb-8 flex items-start"> <div className={`absolute -left-[15px] top-1 h-7 w-7 rounded-full flex items-center justify-center text-white ${ item.status.includes('Disetujui') ? 'bg-green-500' : item.status.includes('Ditolak') ? 'bg-red-500' : 'bg-blue-500' }`}> {item.status.includes('Disetujui') ? <CheckCircle2 className="w-4 h-4" /> : item.status.includes('Ditolak') ? <XCircleIcon className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />} </div> <div className="ml-8"> <p className="font-semibold text-gray-700">[{item.timestamp}] : {item.status}</p> <p className="text-sm text-gray-500">oleh {item.oleh}</p> </div> </div> )) ) : ( <p className="text-sm text-gray-500 ml-8">Tidak ada riwayat status.</p> )} </div> </div> );

// Komponen Modal Detail Pemesanan
const PemesananDetailModal = ({ pesanan, onClose }: { pesanan: Pemesanan | null, onClose: () => void }) => { if (!pesanan) return null; const ModalReviewItem = ({ label, value }) => (<div><strong className="block text-slate-500 text-sm">{label}:</strong><span className="text-gray-800 text-base">{value || '-'}</span></div>); return ( <AnimatePresence> <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}> <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}> <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10"><h3 className="text-2xl font-bold text-gray-800">Detail Pesanan #{pesanan.id.substring(0, 6)}</h3><Button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 bg-transparent text-slate-500 hover:text-slate-700"><XIcon className="w-6 h-6" /></Button></div> <div className="p-6 space-y-6"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mb-4 pb-4 border-b"><ModalReviewItem label="Acara" value={pesanan.acara} /><ModalReviewItem label="Tanggal Pengiriman" value={pesanan.tanggalPengiriman} /><ModalReviewItem label="Waktu" value={`${pesanan.waktu} (${pesanan.jamPengiriman})`} /><ModalReviewItem label="Lokasi" value={pesanan.lokasi} /><ModalReviewItem label="Jenis Tamu" value={pesanan.tamu?.charAt(0).toUpperCase() + pesanan.tamu?.slice(1)} /><ModalReviewItem label="Tanggal Permintaan" value={pesanan.tanggalPermintaan} /><ModalReviewItem label="Yang Mengajukan" value={pesanan.yangMengajukan} /><ModalReviewItem label="Untuk Bagian" value={pesanan.untukBagian} /><ModalReviewItem label="Approval" value={pesanan.approval} /></div><div><h4 className="font-semibold text-lg mb-3 text-gray-800">Item Konsumsi</h4><div className="space-y-3">{(pesanan.konsumsi || []).map((item, index) => { const masterItem = getKonsumsiById(item.id); return ( <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-md border"><img src={masterItem?.img || 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=N/A'} alt={item.jenis} className="h-14 w-14 rounded-md object-cover border" /><div className="flex-1"><span className="font-medium text-slate-800">{item.jenis}</span><span className="block text-sm text-slate-500">Level: {masterItem?.tamuMinLevel ? Object.keys(TINGKAT_TAMU).find(k => TINGKAT_TAMU[k] === masterItem.tamuMinLevel) : 'N/A'}</span></div><span className="text-base font-bold text-blue-600">{item.qty}x</span></div> ); })}</div></div>{pesanan.catatan && (<div><h4 className="font-semibold text-lg mb-2 text-gray-800">Catatan Tambahan</h4><p className="text-sm text-gray-600 bg-slate-50 border p-3 rounded-md italic">{pesanan.catatan}</p></div>)}<StatusTimeline history={pesanan.statusHistory} /></div> </motion.div> </motion.div> </AnimatePresence> ); };

// Komponen Modal Konfirmasi Hapus
const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, orderAcara }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, orderAcara?: string }) => { if (!isOpen) return null; return ( <AnimatePresence> <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"> <motion.div initial={{ scale: 0.9, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: -20, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center"> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100"><AlertTriangleIcon className="h-8 w-8 text-red-600" /></div> <h3 className="mt-5 text-2xl font-bold text-gray-800">Hapus Pesanan</h3> <p className="mt-2 text-gray-600">Apakah Anda yakin ingin menghapus pesanan <strong className="font-semibold text-gray-800">"{orderAcara || 'ini'}"</strong>? Tindakan ini tidak dapat dibatalkan.</p> <div className="mt-8 flex justify-center gap-4"> <Button onClick={onClose} className="w-full rounded-lg bg-slate-200 px-6 py-3 text-base font-semibold text-gray-800 hover:bg-slate-300 transition-colors">Batalkan</Button> <Button onClick={onConfirm} className="w-full rounded-lg bg-red-600 px-6 py-3 text-base font-semibold text-white hover:bg-red-700 transition-colors">Ya, Hapus</Button> </div> </motion.div> </motion.div> </AnimatePresence> ); };


// --- KOMPONEN FORM PEMESANAN ---
interface PemesananFormProps {
    riwayat: Pemesanan[];
    onFormSubmit: (data: any) => void;
    onReturnToDashboard: () => void;
}
const PemesananForm: React.FC<PemesananFormProps> = ({ riwayat = [], onFormSubmit, onReturnToDashboard }) => {
    const [step, setStep] = useState(1);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { acara: "", tanggalPermintaan: getTodayDate(), tanggalPengiriman: getTomorrowDate(), waktu: "", jamPengiriman: "", lokasi: "", tamu: "standar", yangMengajukan: "Riza Ilhamsyah (12231149)", untukBagian: "Dep. Teknologi Informasi PKC (C001370000)", approval: "Jojok Satriadi (1140122)", konsumsi: [{ id: "", jenis: "", qty: "1" }], catatan: "" },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "konsumsi" });
    const waktuValue = form.watch("waktu");
    const tamuValue = form.watch("tamu");
    const konsumsiValues = form.watch("konsumsi");
    const totalQty = useMemo(() => konsumsiValues.reduce((total, item) => total + (parseInt(item.qty, 10) || 0), 0), [konsumsiValues]);
    const dynamicJenisKonsumsiOptions = useMemo(() => { const levelTamu = TINGKAT_TAMU[tamuValue] || 0; if (!waktuValue || !tamuValue) return []; const filtered = MASTER_KONSUMSI.filter(item => item.tamuMinLevel <= levelTamu && item.allowedWaktu.includes(waktuValue)); return filtered.map(item => ({ label: item.nama, value: item.id })); }, [waktuValue, tamuValue]);

    useEffect(() => { const currentKonsumsi = form.getValues('konsumsi'); const validJenisIds = new Set(dynamicJenisKonsumsiOptions.map(opt => opt.value)); currentKonsumsi.forEach((item, index) => { if (item.id && !validJenisIds.has(item.id)) { form.setValue(`konsumsi.${index}.id`, '', { shouldValidate: true }); form.setValue(`konsumsi.${index}.jenis`, '', { shouldValidate: true }); } }); }, [waktuValue, tamuValue, dynamicJenisKonsumsiOptions, form]);
    useEffect(() => { const jamMap = { "Pagi": "07:00", "Siang": "12:00", "Sore": "15:00", "Malam": "19:00", "Sahur": "03:00", "Buka Puasa": "17:30" }; const correspondingJam = jamMap[waktuValue]; form.setValue('jamPengiriman', correspondingJam || '', { shouldValidate: true }); }, [waktuValue, form]);

    const riwayatOptions = useMemo(() => { if (!riwayat || riwayat.length === 0) return []; return riwayat.map((r, index) => ({ label: `${r.acara} (${r.tanggalPengiriman})`, value: index })); }, [riwayat]);
    const handleLoadFromRiwayat = (riwayatIndex: number | null) => { if (riwayatIndex === null || riwayatIndex === undefined) return; const selectedRiwayat = riwayat[riwayatIndex]; if (!selectedRiwayat) return; form.reset({ acara: selectedRiwayat.acara, lokasi: selectedRiwayat.lokasi, tamu: selectedRiwayat.tamu, waktu: selectedRiwayat.waktu, yangMengajukan: selectedRiwayat.yangMengajukan, untukBagian: selectedRiwayat.untukBagian, approval: selectedRiwayat.approval, catatan: selectedRiwayat.catatan || "", konsumsi: (selectedRiwayat.konsumsi || []).map(k => ({ id: k.id || "", jenis: k.jenis || getKonsumsiById(k.id)?.nama || "", qty: k.qty || "1" })), tanggalPermintaan: getTodayDate(), tanggalPengiriman: getTomorrowDate(), jamPengiriman: "", }); form.setValue("waktu", selectedRiwayat.waktu || "", { shouldValidate: true }); form.trigger(); };

    const uniqueAcaraOptions = useMemo(() => { const d = [ "Bahan Minum Karyawan", "Baporkes", "BK3N", "Extra fooding", "Extra Fooding Shift", "Extra Fooding SKJ", "Festival Inovasi", "Halal bil halal", "Rapat Koordinasi", "Pelatihan Internal", "Acara Departemen", "Lainnya" ]; const a = new Set([ ...d, ...(riwayat?.map((r) => r.acara) ?? []) ]); return Array.from(a).map((n) => ({ label: n as string, value: n as string })); }, [riwayat]);
    const waktuOptions = [ { label: "Pagi", value: "Pagi" }, { label: "Siang", value: "Siang" }, { label: "Sore", value: "Sore" }, { label: "Malam", value: "Malam" }, { label: "Sahur", value: "Sahur" }, { label: "Buka Puasa", value: "Buka Puasa" } ];
    const lokasiOptions = [ { label: "Gedung Utama, Ruang Rapat Cempaka", value: "Gedung Utama, Ruang Rapat Cempaka" }, { label: "Gedung Produksi, Area Istirahat", value: "Gedung Produksi, Area Istirahat" }, { label: "Wisma Kujang, Aula Serbaguna", value: "Wisma Kujang, Aula Serbaguna" }, { label: "Gedung Training Center, Ruang 1", value: "Gedung Training Center, Ruang 1" }, { label: "Kantor Departemen TI", value: "Kantor Departemen TI" } ];
    const tamuOptions = [ { label: "Standar", value: "standar" }, { label: "Reguler", value: "reguler" }, { label: "Perta", value: "perta" }, { label: "VIP", value: "vip" }, { label: "VVIP", value: "vvip" } ];
    const bagianOptions = [ { label: "Dep. Teknologi Informasi PKC (C001370000)", value: "Dep. Teknologi Informasi PKC (C001370000)" }, { label: "Dep. Keuangan (C001380000)", value: "Dep. Keuangan (C001380000)" }, { label: "Dep. SDM (C001390000)", value: "Dep. SDM (C001390000)" } ];
    const approvalOptions = [ { label: "Jojok Satriadi (1140122)", value: "Jojok Satriadi (1140122)" }, { label: "Budi Santoso (1120321)", value: "Budi Santoso (1120321)" }, { label: "Citra Lestari (1150489)", value: "Citra Lestari (1150489)" } ];

    const handleNextStep = () => setStep((prev) => prev + 1);
    const handlePrevStep = () => setStep((prev) => prev - 1);
    const handleFinalSubmit = (values) => { const finalValuesWithNama = { ...values, konsumsi: values.konsumsi.map(item => { const masterItem = getKonsumsiById(item.id); return { id: item.id, jenis: masterItem ? masterItem.nama : item.jenis, qty: item.qty }; }) }; console.log("Submitting:", finalValuesWithNama); if (typeof onFormSubmit === 'function') { onFormSubmit(finalValuesWithNama); } else { console.warn("onFormSubmit prop not provided. Skipping submit."); } handleNextStep(); };

    const acaraValue = form.watch("acara");
    const lokasiValue = form.watch("lokasi");
    const bagianValue = form.watch("untukBagian");
    const approvalValue = form.watch("approval");
    const values = form.getValues();
    const labels = { acara: "Nama Acara", tanggalPermintaan: "Tanggal Permintaan", tanggalPengiriman: "Tanggal Pengiriman", waktu: "Waktu", jamPengiriman: "Jam Pengiriman", lokasi: "Lokasi", tamu: "Jenis Tamu", yangMengajukan: "Yang Mengajukan", untukBagian: "Untuk Bagian", approval: "Approval", konsumsi: "Detail Konsumsi", catatan: "Catatan Tambahan" };
    const ReviewItem = ({ label, value, className = "", icon = null as React.ReactNode | null }) => (<div className={cn("flex items-start text-sm", className)}>{icon && <div className="w-5 h-5 mr-2.5 mt-0.5 text-slate-500">{icon}</div>}<div className="flex-1"><span className="block text-slate-500">{label}:</span><span className="block font-medium text-slate-900 break-words">{String(value) || "-"}</span></div></div>);

    return (
        // Latar belakang utama sudah di App/Page
        <div className="py-6 sm:py-10">
             {/* --- PERUBAHAN DI SINI --- */}
             {/* Stepper Header dengan styling sticky */}
             <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm shadow-md py-4 mb-6 sm:mb-10">
                 <div className="flex justify-center items-start gap-4 max-w-2xl mx-auto px-4">
                     {["Isi Form", "Review", "Selesai"].map((label, index) => (
                       <React.Fragment key={index}>
                         <div className="flex flex-col items-center gap-2">
                           <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all duration-300 ${ step > index + 1 ? "bg-green-500 text-white" : step === index + 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`} >
                             {step > index + 1 ? <CheckCircle2 className="w-6 h-6"/> : index + 1}
                           </div>
                           <p className={`text-xs font-semibold ${step >= index + 1 ? "text-gray-800" : "text-gray-400"}`}>{label}</p>
                         </div>
                         {index < 2 && ( <div className={`flex-1 h-1 rounded-full mt-5 ${step > index + 1 ? "bg-green-500" : "bg-gray-200"}`} /> )}
                       </React.Fragment>
                     ))}
                 </div>
             </div>
             {/* --- AKHIR PERUBAHAN --- */}

            {/* Form Content */}
            <div className="px-4">
                <FormStep step={1} currentStep={step}>
                    <Card className="max-w-3xl mx-auto">
                        {/* CardHeader dengan aksen biru */}
                        <CardHeader className="bg-blue-50 border-blue-200"><CardTitle className="text-blue-800">Form Pemesanan Konsumsi</CardTitle><CardDescription className="text-blue-700">Isi detail acara Anda di bawah ini.</CardDescription></CardHeader>
                        <CardContent><form className="space-y-6">
                            {/* Muat dari Riwayat dengan aksen biru */}
                             {riwayatOptions.length > 0 && ( <div className="space-y-2 p-4 bg-blue-50/70 rounded-lg border border-blue-200"><Label htmlFor="loadRiwayat" className="font-semibold text-blue-800">Muat dari Riwayat (Opsional)</Label><SearchableSelect placeholder="Pilih pesanan sebelumnya..." options={riwayatOptions} value={null} onChange={(val) => handleLoadFromRiwayat(val)} error={false} /><p className="text-xs text-blue-700">Gunakan ini untuk mengisi form secara otomatis berdasarkan pesanan lampau.</p></div> )}
                            {/* Fields */}
                            <div className="space-y-2"><Label htmlFor="acara">Nama Acara</Label><SearchableSelect placeholder="Pilih atau ketik jenis acara" options={uniqueAcaraOptions} value={acaraValue} onChange={(val) => form.setValue("acara", val, { shouldValidate: true })} error={!!form.formState.errors.acara} />{form.formState.errors.acara && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.acara.message}</p> )}</div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="space-y-2"><Label htmlFor="tanggalPermintaan">Tanggal Permintaan</Label><Input id="tanggalPermintaan" type="date" {...form.register("tanggalPermintaan")} error={!!form.formState.errors.tanggalPermintaan} />{form.formState.errors.tanggalPermintaan && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.tanggalPermintaan.message}</p> )}</div><div className="space-y-2"><Label htmlFor="tanggalPengiriman">Tanggal Pengiriman (Min. H+1)</Label><Input id="tanggalPengiriman" type="date" {...form.register("tanggalPengiriman")} error={!!form.formState.errors.tanggalPengiriman} />{form.formState.errors.tanggalPengiriman && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.tanggalPengiriman.message}</p> )}</div></div>
                            <div className="space-y-2"><Label htmlFor="lokasi">Lokasi</Label><SearchableSelect placeholder="Pilih atau ketik lokasi" options={lokasiOptions} value={lokasiValue} onChange={(val) => form.setValue("lokasi", val, { shouldValidate: true })} error={!!form.formState.errors.lokasi} />{form.formState.errors.lokasi && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.lokasi.message}</p> )}</div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="space-y-2"><Label htmlFor="tamu">Tamu</Label><SearchableSelect placeholder="Pilih jenis tamu" options={tamuOptions} value={tamuValue} onChange={(val) => form.setValue("tamu", val, { shouldValidate: true })} error={!!form.formState.errors.tamu} />{form.formState.errors.tamu && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.tamu.message}</p> )}</div><div className="space-y-2"><Label htmlFor="waktu">Waktu</Label><SearchableSelect placeholder="Pilih waktu" options={waktuOptions} value={waktuValue} onChange={(val) => form.setValue("waktu", val, { shouldValidate: true })} error={!!form.formState.errors.waktu} />{form.formState.errors.waktu && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.waktu.message}</p> )}</div><div className="space-y-2"><Label htmlFor="jamPengiriman">Jam Pengiriman</Label><Input id="jamPengiriman" type="time" {...form.register("jamPengiriman")} error={!!form.formState.errors.jamPengiriman} />{form.formState.errors.jamPengiriman ? ( <p className="text-sm font-medium text-red-500">{form.formState.errors.jamPengiriman.message}</p> ) : ( <p className="text-xs text-slate-500">Otomatis terisi/bisa diubah</p> )}</div></div>
                            <div className="space-y-2"><Label htmlFor="yangMengajukan">Yang Mengajukan</Label><Input id="yangMengajukan" {...form.register("yangMengajukan")} disabled className="bg-slate-100" error={!!form.formState.errors.yangMengajukan} />{form.formState.errors.yangMengajukan && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.yangMengajukan.message}</p> )}</div>
                            <div className="space-y-2"><Label htmlFor="untukBagian">Untuk Bagian</Label><SearchableSelect placeholder="Pilih bagian" options={bagianOptions} value={bagianValue} onChange={(val) => form.setValue("untukBagian", val, { shouldValidate: true })} error={!!form.formState.errors.untukBagian} />{form.formState.errors.untukBagian && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.untukBagian.message}</p> )}</div>
                            <div className="space-y-2"><Label htmlFor="approval">Approval</Label><SearchableSelect placeholder="Pilih approval" options={approvalOptions} value={approvalValue} onChange={(val) => form.setValue("approval", val, { shouldValidate: true })} error={!!form.formState.errors.approval} />{form.formState.errors.approval && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.approval.message}</p> )}</div>
                            {/* Detail Konsumsi dengan aksen biru */}
                            <div className="space-y-4 rounded-lg border border-blue-200 bg-blue-50/70 p-4">
                                <div className="flex justify-between items-center pb-3 border-b border-blue-200/60"><Label className="font-semibold text-blue-800 text-base">Detail Konsumsi</Label><div className="flex items-center gap-4"><span className="text-sm font-medium text-slate-700">Total Qty: <span className="text-blue-600 font-bold text-base">{totalQty}</span></span><Button type="button" size="sm" onClick={() => append({ id: "", jenis: "", qty: "1" })} className="transition-all duration-200"><Plus className="h-4 w-4 mr-1.5"/>Tambah Item</Button></div></div>
                                {form.formState.errors.konsumsi?.root && ( <p className="text-sm font-medium text-red-500 pt-1">{form.formState.errors.konsumsi.root.message}</p> )}
                                <div className="space-y-4 pt-2">{fields.map((field, index) => ( <div key={field.id} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm transition-shadow hover:shadow-md"><KonsumsiImageWatcher control={form.control} index={index} /><div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1"><div className="w-full space-y-1"><Label htmlFor={`konsumsi.${index}.id`} className="text-xs font-medium text-slate-600">Jenis Konsumsi</Label><Controller control={form.control} name={`konsumsi.${index}.id`} render={({ field: { onChange, value } }) => ( <SearchableSelect placeholder="(Wajib) Pilih Jenis" options={dynamicJenisKonsumsiOptions} value={value} onChange={(selectedId) => { const selectedOption = dynamicJenisKonsumsiOptions.find(opt => opt.value === selectedId); onChange(selectedId); form.setValue(`konsumsi.${index}.jenis`, selectedOption ? selectedOption.label : '', { shouldValidate: true }); }} error={!!form.formState.errors.konsumsi?.[index]?.jenis || !!form.formState.errors.konsumsi?.[index]?.id} /> )} />{(form.formState.errors.konsumsi?.[index]?.jenis || form.formState.errors.konsumsi?.[index]?.id) && ( <p className="text-xs text-red-500">{form.formState.errors.konsumsi?.[index]?.jenis?.message || form.formState.errors.konsumsi?.[index]?.id?.message}</p> )}</div><div className="w-full space-y-1"><Label htmlFor={`konsumsi.${index}.qty`} className="text-xs font-medium text-slate-600">Kuantitas</Label><Controller control={form.control} name={`konsumsi.${index}.qty`} render={({ field }) => ( <QtyStepper value={field.value} onChange={field.onChange} error={!!form.formState.errors.konsumsi?.[index]?.qty} /> )} />{form.formState.errors.konsumsi?.[index]?.qty && ( <p className="text-xs text-red-500">{form.formState.errors.konsumsi?.[index]?.qty?.message}</p> )}</div></div><Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="mt-5 text-red-500 hover:bg-red-50 hover:text-red-600 p-2" disabled={fields.length <= 1}><Trash2 className="h-4 w-4"/></Button></div> ))}</div>
                                <div className="space-y-2 pt-4 border-t border-blue-200/60"><Label htmlFor="catatan">Catatan Tambahan (Opsional)</Label><Input id="catatan" {...form.register("catatan")} placeholder="Contoh: 5 porsi vegetarian, 2 tidak pedas" error={!!form.formState.errors.catatan} />{form.formState.errors.catatan && ( <p className="text-sm font-medium text-red-500">{form.formState.errors.catatan.message}</p> )}</div>
                            </div>
                        </form></CardContent>
                        <CardFooter className="flex justify-between border-t pt-6 mt-6"><Button variant="outline" onClick={onReturnToDashboard}>Batal</Button><Button onClick={form.handleSubmit(handleNextStep)}>Lanjut ke Review</Button></CardFooter>
                    </Card>
                </FormStep>
                <FormStep step={2} currentStep={step}>
                    <Card className="max-w-3xl mx-auto"><CardHeader className="bg-blue-50 border-blue-200"><CardTitle className="text-blue-800">Review Pesanan Anda</CardTitle><CardDescription className="text-blue-700">Pastikan semua data di bawah ini sudah benar sebelum mengirim.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="space-y-4 p-5 border rounded-lg bg-white shadow-inner"><h4 className="flex items-center text-lg font-semibold text-blue-800 -m-5 p-4 rounded-t-lg border-b bg-slate-50"><CalendarDays className="w-5 h-5 mr-2.5 text-blue-600" />Detail Acara & Pengiriman</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4"><ReviewItem label={labels.acara} value={values.acara} /><ReviewItem label={labels.lokasi} value={values.lokasi} /><ReviewItem label={labels.tanggalPengiriman} value={values.tanggalPengiriman} /><ReviewItem label={labels.waktu} value={values.waktu} /><ReviewItem label={labels.jamPengiriman} value={values.jamPengiriman} /><ReviewItem label={labels.tamu} value={values.tamu} className="capitalize" /><ReviewItem label={labels.tanggalPermintaan} value={values.tanggalPermintaan} /></div></div><div className="space-y-4 p-5 border rounded-lg bg-white shadow-inner"><h4 className="flex items-center text-lg font-semibold text-blue-800 -m-5 p-4 rounded-t-lg border-b bg-slate-50"><UserCircle className="w-5 h-5 mr-2.5 text-blue-600" />Detail Pemesan & Approval</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 pt-4"><ReviewItem label={labels.yangMengajukan} value={values.yangMengajukan} /><ReviewItem label={labels.untukBagian} value={values.untukBagian} /><ReviewItem label={labels.approval} value={values.approval} /></div></div><div className="space-y-4 p-5 border rounded-lg bg-white shadow-inner"><h4 className="flex items-center text-lg font-semibold text-blue-800 -m-5 p-4 rounded-t-lg border-b bg-slate-50"><ClipboardList className="w-5 h-5 mr-2.5 text-blue-600" />Ringkasan Item Konsumsi</h4><div className="space-y-3 pt-4">{values.konsumsi.map((item, index) => { const masterItem = getKonsumsiById(item.id); const displayName = masterItem ? masterItem.nama : item.jenis; return ( <div key={index} className="flex items-center gap-4 p-3 bg-slate-50 rounded-md border border-slate-200"><img src={masterItem?.img || 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=N/A'} alt={displayName} className="h-16 w-16 rounded-md object-cover border bg-slate-200" onError={(e: any) => e.target.src = 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=Img Error'} /><div className="flex-1"><span className="font-medium text-slate-800">{displayName}</span><span className="block text-xs text-slate-500">{masterItem ? `Level Tamu: ${Object.keys(TINGKAT_TAMU).find(k => TINGKAT_TAMU[k] === masterItem.tamuMinLevel) || 'N/A'}` : 'Info level tidak tersedia'}</span></div><span className="text-xl font-bold text-blue-600 px-2">{item.qty}x</span></div> ); })}</div><div className="flex justify-end pt-4 border-t border-slate-200 mt-4"><span className="text-lg font-bold text-slate-800">Total Kuantitas: <span className="text-blue-600 text-xl">{totalQty}</span></span></div></div>{values.catatan && ( <div className="space-y-2 p-5 border rounded-lg bg-white shadow-inner"><h4 className="flex items-center text-lg font-semibold text-blue-800 -m-5 p-4 rounded-t-lg border-b bg-slate-50"><FileText className="w-5 h-5 mr-2.5 text-blue-600" />Catatan Tambahan</h4><p className="text-sm text-slate-700 whitespace-pre-wrap italic pt-4">{values.catatan}</p></div> )}</CardContent><CardFooter className="flex justify-between border-t pt-6 mt-6"><Button variant="outline" onClick={handlePrevStep}>Kembali Edit</Button><Button onClick={form.handleSubmit(handleFinalSubmit)}>Konfirmasi & Kirim Pesanan</Button></CardFooter></Card>
                </FormStep>
                <FormStep step={3} currentStep={step}>
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white p-10 rounded-xl shadow-xl border border-gray-200 max-w-md mx-auto"><div className="text-green-500 w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-green-100 rounded-full ring-4 ring-green-200"><CheckCircle2 className="w-16 h-16" /></div><h2 className="text-3xl font-bold text-gray-800 mb-2">Pemesanan Berhasil!</h2><p className="text-gray-600 mt-2 text-base">Pesanan Anda telah berhasil dikirimkan dan menunggu proses approval selanjutnya.</p><Button onClick={onReturnToDashboard} className="mt-8 px-8 py-3 text-base">Kembali ke Dasbor</Button></motion.div>
                </FormStep>
            </div>
        </div>
    );
};


// --- KOMPONEN DASHBOARD PEMESANAN ---
interface PemesananDashboardProps {
    isLoading: boolean;
    riwayatPemesanan: Pemesanan[];
    counts: { Menunggu: number; Disetujui: number; Ditolak: number };
    onNewOrderClick: () => void;
    onUpdateStatus: (id: string, newStatus: 'Disetujui' | 'Ditolak') => void;
    onDeleteOrder: (id: string) => void;
    onViewDetails: (order: Pemesanan) => void;
}
const PemesananDashboard: React.FC<PemesananDashboardProps> = ({ isLoading, riwayatPemesanan = [], counts = { Menunggu: 0, Disetujui: 0, Ditolak: 0 }, onNewOrderClick = () => {}, onUpdateStatus = (id, status) => {}, onDeleteOrder = (id) => {}, onViewDetails = (order) => {}, }) => {
  const [searchDate, setSearchDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [sortOrder, setSortOrder] = useState('Terbaru');
  const [viewMode, setViewMode] = useState('list');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<{id: string, acara: string} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => { const timer = setInterval(() => { setCurrentTime(new Date()); }, 1000); return () => clearInterval(timer); }, []);

  const finalRiwayat = useMemo(() => { const dataToProcess = Array.isArray(riwayatPemesanan) ? riwayatPemesanan : []; return dataToProcess .filter(item => { if (searchDate) { const itemDate = item.tanggalPengiriman; if (itemDate !== searchDate) return false; } if (filterStatus !== 'Semua' && item.status !== filterStatus) return false; return true; }) .sort((a, b) => { const dateA = new Date(a.tanggalPengiriman).getTime(); const dateB = new Date(b.tanggalPengiriman).getTime(); return sortOrder === 'Terbaru' ? dateB - dateA : dateA - dateB; }); }, [riwayatPemesanan, searchDate, filterStatus, sortOrder]);

  const handleOpenDeleteModal = (id: string, acara: string) => { setOrderToDelete({ id, acara }); setIsDeleteModalOpen(true); };
  const handleCloseDeleteModal = () => { setIsDeleteModalOpen(false); setOrderToDelete(null); };
  const handleConfirmDelete = () => { if (!orderToDelete) return; onDeleteOrder(orderToDelete.id); handleCloseDeleteModal(); };

  useEffect(() => { const handleEsc = (event) => { if (event.keyCode === 27) { handleCloseDeleteModal(); } }; window.addEventListener('keydown', handleEsc); return () => window.removeEventListener('keydown', handleEsc); }, []);

  // Tambahkan warna latar belakang yang lebih jelas untuk status
  const statusClasses = {
    Disetujui: 'border-green-500 bg-green-50 hover:bg-green-100 shadow-sm', // Latar belakang hijau muda
    Ditolak: 'border-red-500 bg-red-50 hover:bg-red-100 shadow-sm',     // Latar belakang merah muda
    Menunggu: 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100 shadow-sm', // Latar belakang kuning muda
  };


  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div><h2 className="text-3xl font-bold text-gray-800">Dasbor Pesanan</h2><p className="text-gray-500">Selamat datang! Berikut ringkasan pesanan Anda.</p><p className="text-lg text-gray-700 font-semibold mt-2">{currentTime.toLocaleString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p></div>
          <Button onClick={onNewOrderClick} className="w-full md:w-auto transform hover:scale-105 transition-transform duration-300 bg-blue-600 text-white hover:bg-blue-700 h-11 px-8 rounded-lg shadow-lg shadow-blue-500/30"><PlusCircle className="mr-2 h-5 w-5" /> Buat Pesanan Baru</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8"><StatCard icon={<ClockIcon/>} title="Menunggu" value={counts.Menunggu} colorClass="bg-gradient-to-br from-yellow-400 to-orange-500 text-white" /><StatCard icon={<CheckCircle2/>} title="Disetujui" value={counts.Disetujui} colorClass="bg-gradient-to-br from-green-400 to-teal-500 text-white" /><StatCard icon={<XCircleIcon/>} title="Ditolak" value={counts.Ditolak} colorClass="bg-gradient-to-br from-red-500 to-pink-600 text-white" /></div>
        <Card className="rounded-xl border bg-white text-slate-900 shadow-lg overflow-hidden">
          {/* CardHeader dengan aksen biru */}
          <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center p-6 gap-4 bg-blue-50 border-b border-blue-200"><CardTitle className="text-2xl font-semibold text-blue-800">Riwayat Pemesanan</CardTitle><div className="flex items-center gap-1 rounded-lg bg-blue-100 p-1"><Button onClick={() => setViewMode('list')} className={`h-8 w-8 inline-flex items-center justify-center rounded transition-colors ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'bg-transparent text-blue-700 hover:bg-blue-200'}`}><ListIcon className="w-5 h-5" /></Button><Button onClick={() => setViewMode('grid')} className={`h-8 w-8 inline-flex items-center justify-center rounded transition-colors ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'bg-transparent text-blue-700 hover:bg-blue-200'}`}><GridIcon className="w-5 h-5" /></Button></div></CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 pb-6 border-b border-gray-200"><div className="flex flex-wrap gap-3 w-full sm:w-auto"><div className="relative flex-grow sm:flex-grow-0"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><CalendarIcon className="h-4 w-4 text-gray-400" /></div><input type="date" value={searchDate} onChange={(e) => setSearchDate(e.target.value)} className="flex h-10 w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" /></div><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'Semua' | 'Menunggu' | 'Disetujui' | 'Ditolak')} className="w-full sm:w-[180px] h-10 border border-slate-300 rounded-md px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="Semua">Semua Status</option><option value="Menunggu">Menunggu</option><option value="Disetujui">Disetujui</option><option value="Ditolak">Ditolak</option></select><select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'Terbaru' | 'Terlama')} className="w-full sm:w-[180px] h-10 border border-slate-300 rounded-md px-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"><option value="Terbaru">Terbaru</option><option value="Terlama">Terlama</option></select></div>{/* Export Button Removed */}</div>
            <div className={viewMode === 'list' ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"}>
              {isLoading ? <p className="text-center text-slate-500 py-8 md:col-span-2 xl:col-span-3">Memuat data...</p> : finalRiwayat.length === 0 ? (<div className="text-center py-16 md:col-span-2 xl:col-span-3 bg-slate-100 rounded-lg"> {/* Ganti bg */} <FileTextIcon className="text-gray-400 w-20 h-20 mx-auto"/><h4 className="text-xl font-semibold text-gray-700 mt-4">Tidak Ada Pesanan Ditemukan</h4><p className="text-gray-500 mt-1">Ubah filter Anda atau buat pesanan baru.</p></div>) :
               (<AnimatePresence>{finalRiwayat.map((item: Pemesanan, index: number) => (
                    <motion.div key={item.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05 } }} exit={{ opacity: 0, scale: 0.95 }} className={`p-5 rounded-lg flex transition-all duration-300 border-l-4 shadow-md hover:shadow-lg ${statusClasses[item.status]} ${viewMode === 'list' ? 'flex-col sm:flex-row justify-between sm:items-center gap-4' : 'flex-col gap-3'}`}>
                        <div className="space-y-1.5 w-full"><p className="font-semibold text-lg text-gray-800">{item.acara}</p><div className={`text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1 ${viewMode === 'grid' ? 'flex-col items-start !gap-y-1.5' : 'items-center'}`}><div className="flex items-center gap-1.5"><CalendarIcon className="w-4 h-4 text-gray-500" /><span>{item.tanggalPengiriman}</span></div><div className="flex items-center gap-1.5"><ClockIcon className="w-4 h-4 text-gray-500" /><span>{item.jamPengiriman || '--:--'}</span></div><div className="flex items-center gap-1.5"><MapPinIcon className="w-4 h-4 text-gray-500" /><span>{item.lokasi}</span></div></div></div>
                        <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'justify-end flex-shrink-0' : 'justify-between w-full border-t border-slate-200/60 pt-3 mt-3'}`}>
                            <div className="flex-shrink-0"><div className="flex items-center gap-2"><span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full ${ item.status === 'Menunggu' ? 'bg-yellow-100 text-yellow-800 ring-1 ring-yellow-300' : item.status === 'Disetujui' ? 'bg-green-100 text-green-800 ring-1 ring-green-300' : 'bg-red-100 text-red-800 ring-1 ring-red-300' }`}>{item.status === 'Menunggu' ? <ClockIcon className="w-3.5 h-3.5" /> : item.status === 'Disetujui' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircleIcon className="w-3.5 h-3.5" />}{item.status}</span>{item.status === 'Menunggu' && ( <><div className="h-5 w-px bg-slate-300 hidden sm:block"></div><Button onClick={() => onUpdateStatus(item.id, 'Disetujui')} className="h-7 px-2.5 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 font-medium">Setujui</Button><Button onClick={() => onUpdateStatus(item.id, 'Ditolak')} className="h-7 px-2.5 rounded text-xs bg-red-600 text-white hover:bg-red-700 font-medium">Tolak</Button></> )}</div></div>
                            <div className="flex items-center"><Button onClick={() => onViewDetails(item)} className="h-8 w-8 hover:bg-slate-200/70 inline-flex items-center justify-center rounded bg-transparent text-slate-500 hover:text-slate-700"><Eye className="w-4 h-4" /></Button><Button className="text-red-500 hover:bg-red-100 h-8 w-8 inline-flex items-center justify-center rounded bg-transparent hover:text-red-600" onClick={() => handleOpenDeleteModal(item.id, item.acara)}><Trash2 className="w-4 h-4" /></Button></div>
                        </div>
                    </motion.div>
                ))}
               </AnimatePresence>)
              }
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete} orderAcara={orderToDelete?.acara} />
    </>
  );
}


// --- KOMPONEN UTAMA APLIKASI (APP) ---
const App = () => {
    const [currentView, setCurrentView] = useState<'dashboard' | 'form'>('dashboard');
    const [riwayatPemesanan, setRiwayatPemesanan] = useState<Pemesanan[]>([ /* ... data dummy ... */ { id: 'ord-1', acara: 'Rapat Tahunan Koperasi', tanggalPermintaan: '2025-10-20', tanggalPengiriman: '2025-10-25', waktu: 'Pagi', jamPengiriman: '09:00', lokasi: 'Aula Utama', tamu: 'reguler', yangMengajukan: 'Budi Santoso', untukBagian: 'Koperasi', approval: 'Citra Lestari', konsumsi: [{ id: 'reg-snack', jenis: 'Snack Box Reguler', qty: '50' }], status: 'Menunggu', statusHistory: [ { timestamp: '20 Okt 2025, 10:05:12', status: 'Pesanan Dibuat', oleh: 'Budi Santoso' } ] }, { id: 'ord-2', acara: 'Pelatihan Internal TI', tanggalPermintaan: '2025-10-21', tanggalPengiriman: '2025-10-28', waktu: 'Siang', jamPengiriman: '12:30', lokasi: 'Ruang Training C', tamu: 'standar', yangMengajukan: 'Riza Ilhamsyah', untukBagian: 'Dep. TI', approval: 'Jojok Satriadi', konsumsi: [{ id: 'std-nasi', jenis: 'Nasi Box Standar', qty: '25' }, { id: 'std-kopi', jenis: 'Kopi & Teh (Sachet)', qty: '25' }], status: 'Disetujui', statusHistory: [ { timestamp: '21 Okt 2025, 14:30:00', status: 'Pesanan Dibuat', oleh: 'Riza Ilhamsyah' }, { timestamp: '22 Okt 2025, 09:15:00', status: 'Pesanan Disetujui', oleh: 'Jojok Satriadi' } ] }, { id: 'ord-3', acara: 'Acara Departemen Keuangan', tanggalPermintaan: '2025-10-15', tanggalPengiriman: '2025-10-22', waktu: 'Malam', jamPengiriman: '19:00', lokasi: 'Restoran ABC', tamu: 'vip', yangMengajukan: 'Citra Lestari', untukBagian: 'Dep. Keuangan', approval: 'Budi Santoso', konsumsi: [{ id: 'vip-prasmanan', jenis: 'Prasmanan VIP', qty: '30' }], status: 'Ditolak', statusHistory: [ { timestamp: '15 Okt 2025, 08:00:00', status: 'Pesanan Dibuat', oleh: 'Citra Lestari' }, { timestamp: '15 Okt 2025, 11:30:00', status: 'Pesanan Ditolak', oleh: 'Budi Santoso' } ] } ]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Pemesanan | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, title: '', description: '' });

    const counts = useMemo(() => { return riwayatPemesanan.reduce((acc, curr) => { if (!acc[curr.status]) acc[curr.status] = 0; acc[curr.status]++; return acc; }, { Menunggu: 0, Disetujui: 0, Ditolak: 0 }); }, [riwayatPemesanan]);
    const handleNewOrderClick = () => setCurrentView('form');
    const handleReturnToDashboard = () => setCurrentView('dashboard');
    const handleFormSubmit = (formData) => { const newOrder: Pemesanan = { ...formData, id: `ord-${Date.now()}`, status: 'Menunggu', statusHistory: [{ timestamp: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }), status: 'Pesanan Dibuat', oleh: formData.yangMengajukan }] }; setRiwayatPemesanan(prev => [newOrder, ...prev]); showToast('Sukses', `Pesanan "${newOrder.acara}" berhasil ditambahkan.`); setCurrentView('dashboard'); };
    const handleUpdateStatus = (id: string, newStatus: 'Disetujui' | 'Ditolak') => { let updatedAcara = ''; setRiwayatPemesanan(prevRiwayat => prevRiwayat.map(item => { if (item.id === id) { updatedAcara = item.acara; const newHistoryEntry: StatusHistoryItem = { timestamp: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }), status: `Pesanan Di${newStatus}`, oleh: 'Admin Sistem' }; const currentHistory = Array.isArray(item.statusHistory) ? item.statusHistory : []; return { ...item, status: newStatus, statusHistory: [...currentHistory, newHistoryEntry] }; } return item; }) ); showToast('Status Diperbarui', `Status pesanan "${updatedAcara}" diubah menjadi ${newStatus}.`); if (selectedOrder && selectedOrder.id === id) { setSelectedOrder(prev => { if (!prev) return null; const newHistoryEntry: StatusHistoryItem = { timestamp: new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }), status: `Pesanan Di${newStatus}`, oleh: 'Admin Sistem' }; const currentHistory = Array.isArray(prev.statusHistory) ? prev.statusHistory : []; return { ...prev, status: newStatus, statusHistory: [...currentHistory, newHistoryEntry] }; }); } };
    const handleDeleteOrder = (id: string) => { let deletedAcara = ''; setRiwayatPemesanan(prevRiwayat => { const itemToDelete = prevRiwayat.find(item => item.id === id); if (itemToDelete) deletedAcara = itemToDelete.acara; return prevRiwayat.filter(item => item.id !== id); }); showToast('Pesanan Dihapus', `Pesanan "${deletedAcara}" telah dihapus.`); };
    const handleViewDetails = (order: Pemesanan) => { setSelectedOrder(order); setIsDetailModalOpen(true); };
    const handleCloseDetailDialog = () => { setIsDetailModalOpen(false); setSelectedOrder(null); };
    const showToast = (title, description) => { setToast({ show: true, title, description }); setTimeout(() => setToast({ show: false, title: '', description: '' }), 3000); };

    const dashboardProps = { isLoading, riwayatPemesanan, counts, onNewOrderClick: handleNewOrderClick, onUpdateStatus: handleUpdateStatus, onDeleteOrder: handleDeleteOrder, onViewDetails: handleViewDetails };
    const formProps = { riwayat: riwayatPemesanan, onFormSubmit: handleFormSubmit, onReturnToDashboard: handleReturnToDashboard };

    return (
        // Latar belakang utama diatur di sini: bg-slate-50
        <div className="bg-slate-50 min-h-screen font-['Poppins',_sans-serif] text-slate-900">
          <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>
          <div className="container mx-auto p-0 max-w-none"> {/* Hapus padding container */}
            <AnimatePresence mode="wait">
              <motion.div key={currentView} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                {currentView === 'dashboard' ? (<PemesananDashboard {...dashboardProps} />) : (<PemesananForm {...formProps} />)}
              </motion.div>
            </AnimatePresence>
            {/* Modal Detail dan Toast dipanggil di sini */}
            {isDetailModalOpen && (<PemesananDetailModal pesanan={selectedOrder} onClose={handleCloseDetailDialog} />)}
            <AnimatePresence>{toast.show && (<motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed bottom-5 right-5 bg-slate-900 text-white p-4 rounded-lg shadow-lg z-[100] w-80"><p className="font-bold">{toast.title}</p><p className="text-sm text-slate-300">{toast.description}</p></motion.div>)}</AnimatePresence>
          </div>
        </div>
      );
};

export default App; // Export App sebagai komponen utama