import React, { useState, useMemo, useEffect, forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Impor hook form, zod, dll.
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod"; // FIX: Mengganti '*s' menjadi '* as'

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
// Mengembalikan format ISO date string (YYYY-MM-DD) yang stabil
const getTodayDate = () => new Date().toISOString().split('T')[0];
const getTomorrowDate = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };

// --- DATA KONSUMSI MASTER (Disesuaikan untuk konsistensi) ---
const TINGKAT_TAMU = { 'standar': 1, 'reguler': 2, 'perta': 3, 'vip': 4, 'vvip': 5 };
const MASTER_KONSUMSI = [
    { id: 'std-nasi', nama: 'Nasi Box Standar', tamuMinLevel: 1, allowedWaktu: ['Siang', 'Malam'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Nasi+Std' },
    { id: 'std-snack', nama: 'Snack Box Standar', tamuMinLevel: 1, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Snack+Std' },
    { id: 'std-kopi', nama: 'Kopi & Teh (Sachet)', tamuMinLevel: 1, allowedWaktu: ['Pagi', 'Sore'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Kopi' },
    { id: 'reg-nasi', nama: 'Nasi Box Reguler', tamuMinLevel: 2, allowedWaktu: ['Siang', 'Malam'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Nasi+Reg' },
    { id: 'reg-snack', nama: 'Snack Box Reguler', tamuMinLevel: 2, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Snack+Reg' },
    { id: 'reg-prasmanan', nama: 'Prasmanan Reguler', tamuMinLevel: 2, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Prasmanan' },
    { id: 'perta-nasi', nama: 'Nasi Box Perta', tamuMinLevel: 3, allowedWaktu: ['Siang', 'Malam'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Nasi+Perta' },
    { id: 'vip-prasmanan', nama: 'Prasmanan VIP', tamuMinLevel: 4, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Prasmanan+VIP' },
    { id: 'vvip-snack', nama: 'Snack VVIP (High Tea)', tamuMinLevel: 5, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa'], img: 'https://placehold.co/200x200/F0F9FF/007AFF?text=Snack+VVIP' },
];
const getKonsumsiById = (id) => id ? MASTER_KONSUMSI.find(item => item.id === id) : undefined;

// Dummy data untuk riwayat
const DUMMY_RIWAYAT = [ 
    { id: 'ord-2', acara: 'Pelatihan Internal TI', tanggalPermintaan: '2025-10-21', tanggalPengiriman: '2025-10-28', waktu: 'Siang', jamPengiriman: '12:30', lokasi: 'Ruang Training C', tamu: 'standar', yangMengajukan: 'Riza Ilhamsyah', untukBagian: 'Dep. TI', approval: 'Jojok Satriadi', konsumsi: [{ id: 'std-nasi', jenis: 'Nasi Box Standar', qty: '25' }, { id: 'std-kopi', jenis: 'Kopi & Teh (Sachet)', qty: '25' }], status: 'Disetujui', statusHistory: [] }, 
];

// --- SCHEMA DEFINITION (DISINKRONKAN) ---
const isTomorrowOrLater = (dateString) => { const today = new Date(); const selectedDate = new Date(dateString); today.setHours(0, 0, 0, 0); selectedDate.setHours(0, 0, 0, 0); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); return selectedDate >= tomorrow; };

const konsumsiItemFormSchema = z.object({ 
    id: z.string().min(1, "Jenis konsumsi harus dipilih."),
    jenis: z.string().optional(), 
    qty: z.string().refine((val) => /^\d+$/.test(val) && parseInt(val, 10) > 0, { message: "Kuantitas harus > 0." }), 
});

const formSchema = z.object({ 
    acara: z.string().min(3, "Nama acara min 3 karakter."), 
    tanggalPermintaan: z.string().refine(v => !isNaN(Date.parse(v)), "Tgl permintaan invalid."), 
    tanggalPengiriman: z.string().refine(v => !isNaN(Date.parse(v)), "Tgl pengiriman invalid.").refine(isTomorrowOrLater, "Tgl pengiriman min H+1."), 
    waktu: z.string().min(1, "Waktu harus dipilih."), 
    jamPengiriman: z.string().optional(), 
    lokasi: z.string().min(3, "Lokasi min 3 karakter."), 
    tamu: z.string().min(1, "Tamu harus dipilih."), 
    yangMengajukan: z.string().min(3, "Pengaju harus dipilih."), 
    untukBagian: z.string().min(3, "Bagian harus dipilih."), 
    approval: z.string().min(3, "Approval harus dipilih."), 
    konsumsi: z.array(konsumsiItemFormSchema).min(1, "Min 1 konsumsi."), 
    catatan: z.string().optional(), 
});


// --- KOMPONEN UI DASAR & IKON ---

const Button = forwardRef(({ className, variant = 'primary', size = 'default', ...props }, ref) => { 
    const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transform"; 
    const variants = { 
        primary: "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-xl hover:scale-[1.02]", 
        destructive: "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 hover:shadow-xl hover:scale-[1.02]", 
        outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600 hover:scale-[1.01]", 
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300/80 hover:scale-[1.01]", 
        ghost: "hover:bg-gray-100 text-gray-600 hover:text-blue-600 hover:scale-[1.01]" 
    }; 
    const sizes = { default: "h-10 py-2 px-4", sm: "h-9 px-3 rounded-md", lg: "h-11 px-8 rounded-lg" }; 
    return <button className={cn(base, variants[variant], sizes[size], className)} ref={ref} {...props} />; 
});
const Card = forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("rounded-xl border border-gray-100 bg-white text-slate-900 shadow-2xl shadow-gray-200/50", className)} {...props} />);
const CardHeader = forwardRef(({ children, className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 bg-blue-50/50 border-b border-blue-100 rounded-t-xl", className)} {...props}>{children}</div>);
const CardTitle = forwardRef(({ className, children, ...props }, ref) => <h3 ref={ref} className={cn("text-2xl font-bold leading-none tracking-tight text-blue-800", className)} {...props}>{children}</h3>);
const CardDescription = forwardRef(({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-blue-700", className)} {...props} />);
const CardContent = forwardRef(({ className, children, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-6", className)} {...props}>{children}</div>);
const CardFooter = forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-6 border-t border-slate-100 justify-between", className)} {...props} />);
const Input = forwardRef(({ className, error, ...props }, ref) => <input className={cn( "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-90 disabled:bg-gray-100", error && "border-red-500 focus:ring-red-500", className )} ref={ref} {...props} />);
const Label = forwardRef(({ className, ...props }, ref) => <label ref={ref} className={cn("text-sm font-medium leading-none text-gray-700", className)} {...props} />);

// Icons
const CheckCircle2 = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>;
const ChevronDown = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>;
const SearchIcon = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const Trash2 = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const Plus = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const Minus = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const CalendarDays = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>;
const UserCircle = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>;
const Utensils = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M15 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M8 22v-4M18 22v-4M12 22V2"/></svg>;
const FileText = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
const Clock = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const MapPin = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 12V2L12 12V2M12 12L5 15L12 22L19 15L12 12ZM12 12C12 12 12 12 12 12Z" transform="translate(0, -2)" /><path d="M12 2a8 8 0 0 1 8 8c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 8-8z"/><circle cx="12" cy="10" r="3"/></svg>;
const Users = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ClipboardList = ({ className = "" }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;


// Komponen Form Step
const FormStep = ({ children, step, currentStep }) => { 
    if (step !== currentStep) return null; 
    return (<motion.div initial={{ opacity: 0, x: 20 * (step - currentStep) }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 * (step - currentStep) }} transition={{ duration: 0.3, ease: "easeInOut" }} className="mb-8">{children}</motion.div>); 
};


// Komponen Searchable Select
const SearchableSelect = ({ options = [], value, onChange, placeholder = "Pilih opsi...", error }) => { 
    const [search, setSearch] = useState(""); 
    const [isOpen, setIsOpen] = useState(false); 
    const containerRef = useRef(null); 
    const searchInputRef = useRef(null); 
    const filteredOptions = useMemo(() => options.filter(opt => opt.label?.toLowerCase().includes(search.toLowerCase())), [options, search]); 
    
    useEffect(() => { 
        const handleClickOutside = (event) => { if (containerRef.current && !containerRef.current.contains(event.target)) setIsOpen(false); }; 
        document.addEventListener("mousedown", handleClickOutside); 
        return () => document.removeEventListener("mousedown", handleClickOutside); 
    }, []); 

    useEffect(() => { if (isOpen && searchInputRef.current) searchInputRef.current.focus(); }, [isOpen]); 
    
    const handleOptionClick = (val) => { onChange(val); setSearch(""); setIsOpen(false); }; 
    const selectedLabel = options.find(opt => opt.value === value)?.label || ""; 

    return ( 
        <div className="relative w-full" ref={containerRef}> 
            <button type="button" className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500", !selectedLabel && "text-gray-500", error && "border-red-500 focus:ring-red-500")} onClick={() => setIsOpen(!isOpen)}> 
                <span className="truncate">{selectedLabel || placeholder}</span>
                <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} /> 
            </button> 
            {isOpen && ( 
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl max-h-64 flex flex-col overflow-hidden"> 
                    <div className="p-2 flex-shrink-0"> 
                        <div className="relative"> 
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /> 
                            <input ref={searchInputRef} type="text" placeholder="Cari..." className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" value={search} onChange={(e) => setSearch(e.target.value)} /> 
                        </div> 
                    </div> 
                    <div className="overflow-auto flex-1 p-1"> 
                        {filteredOptions.length > 0 ? ( 
                            filteredOptions.map((option, index) => (
                                <div key={index} onClick={() => handleOptionClick(option.value)} className={cn("cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700", value === option.value && "bg-blue-100 text-blue-800 font-medium")}>
                                    {option.label}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm text-center text-gray-500">Tidak ada hasil</div>
                        )} 
                    </div> 
                </motion.div> 
            )} 
        </div> 
    ); 
};


// Komponen Qty Stepper (FINAL REVISI: Memastikan tombol + dan - seragam dan terlihat jelas)
const QtyStepper = ({ value, onChange, error }) => { 
    const numValue = parseInt(value, 10) || 0; 
    const handleIncrement = () => { onChange(String(numValue + 1)); }; 
    const handleDecrement = () => { if (numValue > 1) onChange(String(numValue - 1)); }; 
    
    return ( 
        <div className={cn("flex items-center w-full h-10 rounded-lg border border-gray-300 bg-white transition-all overflow-hidden", error && "border-red-500 focus-within:ring-2 focus-within:ring-red-500")}> 
            {/* Tombol Minus - h-full w-10 */}
            <Button type="button" variant="ghost" size="sm" className="h-full w-10 p-0 rounded-r-none border-r border-gray-300 text-gray-600 hover:bg-gray-100 flex-shrink-0" onClick={handleDecrement} disabled={numValue <= 1}>
                <Minus className="h-5 w-5" />
            </Button>
            {/* Display Kuantitas - flex-1 */}
            <span className="flex-1 text-center text-base font-semibold text-gray-900 min-w-[30px]">{numValue}</span>
            {/* Tombol Plus - h-full w-10 */}
            <Button type="button" variant="ghost" size="sm" className="h-full w-10 p-0 rounded-l-none border-l border-gray-300 text-gray-600 hover:bg-gray-100 flex-shrink-0" onClick={handleIncrement}>
                <Plus className="h-5 w-5" />
            </Button>
        </div> 
    ); 
};


// Komponen Image Watcher
const KonsumsiImageWatcher = ({ control, index }) => { 
    const itemId = useWatch({ control, name: `konsumsi.${index}.id` });
    const itemData = getKonsumsiById(itemId); 
    
    const labelText = itemData?.nama.split(' ')[0] + ' ' + (itemData?.nama.split(' ')[1] || 'Item');

    return (
        <div className='flex flex-col items-center justify-center p-2'>
            <img src={itemData?.img || 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=Pilih'} alt={itemData?.nama || 'Placeholder'} className="h-16 w-16 flex-shrink-0 rounded-md object-cover border border-gray-200 transition-all duration-300" onError={(e) => e.target.src = 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=Error'} />
            <span className="text-xs text-blue-600 font-medium mt-1 text-center">{itemData ? labelText : 'Pilih Item'}</span>
        </div>
    );
};


// --- KOMPONEN FORM PEMESANAN UTAMA ---
const PemesananForm = ({ riwayat = DUMMY_RIWAYAT, onFormSubmit = (data) => console.log('Form Submitted:', data), onReturnToDashboard = () => console.log('Kembali ke Dashboard (Dummy)') }) => {
    const [step, setStep] = useState(1);
    
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: { acara: "", tanggalPermintaan: getTodayDate(), tanggalPengiriman: getTomorrowDate(), waktu: "Pagi", jamPengiriman: "07:00", lokasi: "", tamu: "standar", yangMengajukan: "Riza Ilhamsyah (12231149)", untukBagian: "Dep. Teknologi Informasi PKC (C001370000)", approval: "Jojok Satriadi (1140122)", konsumsi: [{ id: "", jenis: "", qty: "1" }], catatan: "" },
    });
    
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "konsumsi" });

    // Watch values untuk logic dinamis
    const waktuValue = form.watch("waktu");
    const tamuValue = form.watch("tamu");
    const konsumsiValues = form.watch("konsumsi");
    const totalQty = useMemo(() => konsumsiValues.reduce((total, item) => total + (parseInt(item.qty, 10) || 0), 0), [konsumsiValues]);

    // Logic DYNAMIC KONSUMSI
    const dynamicJenisKonsumsiOptions = useMemo(() => { 
        const levelTamu = TINGKAT_TAMU[tamuValue] || 0; 
        if (!waktuValue || !tamuValue) return []; 
        const filtered = MASTER_KONSUMSI.filter(item => 
            item.tamuMinLevel <= levelTamu && item.allowedWaktu.includes(waktuValue)
        ); 
        return filtered.map(item => ({ label: item.nama, value: item.id })); 
    }, [waktuValue, tamuValue]);


    // Effect untuk reset konsumsi jika filter berubah
    useEffect(() => { 
        const currentKonsumsi = form.getValues('konsumsi'); 
        const validJenisIds = new Set(dynamicJenisKonsumsiOptions.map(opt => opt.value)); 
        currentKonsumsi.forEach((item, index) => { 
            if (item.id && !validJenisIds.has(item.id)) { 
                form.setValue(`konsumsi.${index}.id`, '', { shouldValidate: true }); 
                form.setValue(`konsumsi.${index}.jenis`, '', { shouldValidate: true }); 
            } 
        }); 
    }, [waktuValue, tamuValue, dynamicJenisKonsumsiOptions, form]);

    // Helper untuk auto-fill jam
    const autoFillJam = (selectedWaktu, fieldChange) => {
        const jamMap = { "Pagi": "07:00", "Siang": "12:00", "Sore": "15:00", "Malam": "19:00", "Sahur": "03:00", "Buka Puasa": "17:30" };
        const correspondingJam = jamMap[selectedWaktu];
        
        const currentJam = form.getValues('jamPengiriman');
        const isDefaultTime = Object.values(jamMap).includes(currentJam);

        if (!currentJam || isDefaultTime) {
             form.setValue('jamPengiriman', correspondingJam || '', { shouldValidate: true });
        }
        
        fieldChange(selectedWaktu);
    };

    // Handler Load from Riwayat
    const riwayatOptions = useMemo(() => { if (!riwayat || riwayat.length === 0) return []; return riwayat.map((r, index) => ({ label: `${r.acara} (${r.tanggalPengiriman})`, value: index })); }, [riwayat]);
    const handleLoadFromRiwayat = (riwayatIndex) => { 
        if (riwayatIndex === null || riwayatIndex === undefined) return; 
        const selectedRiwayat = riwayat[riwayatIndex]; 
        if (!selectedRiwayat) return; 
        
        form.reset({ 
            acara: selectedRiwayat.acara, 
            lokasi: selectedRiwayat.lokasi, 
            tamu: selectedRiwayat.tamu, 
            waktu: selectedRiwayat.waktu, 
            yangMengajukan: selectedRiwayat.yangMengajukan, 
            untukBagian: selectedRiwayat.untukBagian, 
            approval: selectedRiwayat.approval, 
            catatan: selectedRiwayat.catatan || "", 
            konsumsi: (selectedRiwayat.konsumsi || []).map(k => ({ 
                id: k.id || "", 
                jenis: k.jenis || getKonsumsiById(k.id)?.nama || "", 
                qty: k.qty || "1" 
            })), 
            tanggalPermintaan: getTodayDate(), 
            tanggalPengiriman: getTomorrowDate(), 
            jamPengiriman: "", 
        }); 
        form.setValue("waktu", selectedRiwayat.waktu || "", { shouldValidate: true }); 
        form.trigger(); 
    };

    // Opsi statis
    const uniqueAcaraOptions = useMemo(() => { const d = [ "Bahan Minum Karyawan", "Baporkes", "BK3N", "Extra fooding", "Extra Fooding Shift", "Extra Fooding SKJ", "Festival Inovasi", "Halal bil halal", "Rapat Koordinasi", "Pelatihan Internal", "Acara Departemen", "Lainnya" ]; const a = new Set([ ...d, ...(riwayat?.map((r) => r.acara) ?? []) ]); return Array.from(a).map((n) => ({ label: n, value: n })); }, [riwayat]);
    const waktuOptions = [ { label: "Pagi (07:00)", value: "Pagi" }, { label: "Siang (12:00)", value: "Siang" }, { label: "Sore (15:00)", value: "Sore" }, { label: "Malam (19:00)", value: "Malam" }, { label: "Sahur (03:00)", value: "Sahur" }, { label: "Buka Puasa (17:30)", value: "Buka Puasa" } ];
    const lokasiOptions = [ { label: "Gedung Utama, Ruang Rapat Cempaka", value: "Gedung Utama, Ruang Rapat Cempaka" }, { label: "Gedung Produksi, Area Istirahat", value: "Gedung Produksi, Area Istirahat" }, { label: "Wisma Kujang, Aula Serbaguna", value: "Wisma Kujang, Aula Serbaguna" }, { label: "Gedung Training Center, Ruang 1", value: "Gedung Training Center, Ruang 1" }, { label: "Kantor Departemen TI", value: "Kantor Departemen TI" } ];
    const tamuOptions = [ { label: "Standar (Level 1)", value: "standar" }, { label: "Reguler (Level 2)", value: "reguler" }, { label: "Perta (Level 3)", value: "perta" }, { label: "VIP (Level 4)", value: "vip" }, { label: "VVIP (Level 5)", value: "vvip" } ];
    const bagianOptions = [ { label: "Dep. Teknologi Informasi PKC (C001370000)", value: "Dep. Teknologi Informasi PKC (C001370000)" }, { label: "Dep. Keuangan (C001380000)", value: "Dep. Keuangan (C001380000)" }, { label: "Dep. SDM (C001390000)", value: "Dep. SDM (C001390000)" } ];
    const approvalOptions = [ { label: "Jojok Satriadi (1140122)", value: "Jojok Satriadi (1140122)" }, { label: "Budi Santoso (1120321)", value: "Budi Santoso (1120321)" }, { label: "Citra Lestari (1150489)", value: "Citra Lestari (1150489)" } ];


    // Handle Submit
    const handleNextStep = async () => {
        if (step === 1) {
            const isValid = await form.trigger();
            if (isValid) setStep(2);
        } else if (step === 2) {
            form.handleSubmit(handleFinalSubmit)();
        } else {
            setStep((prev) => prev + 1);
        }
    };
    const handlePrevStep = () => setStep((prev) => prev - 1);
    
    const handleFinalSubmit = (values) => { 
        const finalValuesWithNama = { 
            ...values, 
            konsumsi: values.konsumsi.map(item => { 
                const masterItem = getKonsumsiById(item.id); 
                return { id: item.id, jenis: masterItem ? masterItem.nama : item.jenis, qty: item.qty }; 
            }) 
        }; 

        onFormSubmit(finalValuesWithNama); 
        setStep(3); // Langsung pindah ke step 3 setelah submit
    };


    const acaraValue = form.watch("acara");
    const lokasiValue = form.watch("lokasi");
    const bagianValue = form.watch("untukBagian");
    const approvalValue = form.watch("approval");
    const values = form.getValues();
    const labels = { acara: "Nama Acara", tanggalPermintaan: "Tanggal Permintaan", tanggalPengiriman: "Tanggal Pengiriman", waktu: "Waktu", jamPengiriman: "Jam Pengiriman", lokasi: "Lokasi", tamu: "Jenis Tamu", yangMengajukan: "Yang Mengajukan", untukBagian: "Untuk Bagian", approval: "Approval", konsumsi: "Detail Konsumsi", catatan: "Catatan Tambahan" };
    
    // Komponen ReviewItem yang lebih bersih
    const ReviewItem = ({ label, value, className = "", icon = null }) => (
        <div className={cn("flex items-start text-sm", className)}>
            <div className="w-5 h-5 mr-3 mt-0.5 text-blue-500 flex-shrink-0">{icon}</div>
            <div className="flex-1">
                <span className="block text-gray-500 text-xs uppercase tracking-wider">{label}</span>
                <span className="block font-semibold text-gray-900 break-words mt-0.5 text-base">{String(value) || "-"}</span>
            </div>
        </div>
    );

    return (
        // Kontainer utama menggunakan w-full dan min-h-screen
        <div className="bg-gray-50 min-h-screen font-['Poppins',_sans-serif] text-gray-900">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>
            
            {/* Stepper Header FIX: Sticky top-0 dan padding horizontal */}
            <div className="sticky top-0 z-20 bg-white shadow-lg py-5 mb-8 rounded-b-xl border-b border-gray-100 px-4">
                <div className="flex justify-center items-center gap-4 max-w-xl mx-auto">
                    {["Isi Form", "Review", "Selesai"].map((label, index) => (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center gap-2">
                                <motion.div className="w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all duration-500" 
                                    style={{ 
                                        backgroundColor: step > index + 1 ? '#10B981' : step === index + 1 ? '#2563EB' : '#E5E7EB', 
                                        color: 'white',
                                        scale: step === index + 1 ? 1.1 : 1
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                >
                                    {step > index + 1 ? <CheckCircle2 className="w-6 h-6"/> : index + 1}
                                </motion.div>
                                <p className={`text-sm font-semibold mt-1 ${step >= index + 1 ? "text-blue-800" : "text-gray-500"}`}>{label}</p>
                            </div>
                            {index < 2 && ( 
                                <div className="flex-1 h-1 rounded-full mt-[-20px] transition-all duration-500" 
                                    style={{ backgroundColor: step > index + 1 ? '#10B981' : '#E5E7EB' }} 
                                /> 
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            
            {/* Form Content Wrapper: Tambahkan padding horizontal di sini */}
            <div className="p-4 sm:p-6 md:p-10">
                <AnimatePresence mode="wait">
                    <FormStep key={1} step={1} currentStep={step}>
                        {/* Card mengambil lebar penuh (w-full) di wrapper dengan padding yang membatasi max-w*/}
                        <Card className="mx-auto w-full md:max-w-4xl">
                            <CardHeader><CardTitle>Form Pemesanan Konsumsi</CardTitle><CardDescription>Isi detail acara Anda di bawah ini dengan lengkap.</CardDescription></CardHeader>
                            <CardContent>
                                <form className="space-y-8">

                                    {/* Muat dari Riwayat */}
                                    {riwayatOptions.length > 0 && ( 
                                        <div className="space-y-3 p-4 bg-blue-50/70 rounded-xl border border-blue-200/50 shadow-inner">
                                            <Label htmlFor="loadRiwayat" className="font-bold text-blue-800 flex items-center"><ClipboardList className="h-5 w-5 mr-2"/> Muat dari Riwayat (Opsional)</Label>
                                            <SearchableSelect placeholder="Pilih pesanan sebelumnya untuk mengisi form..." options={riwayatOptions} value={null} onChange={(val) => handleLoadFromRiwayat(val)} error={false} />
                                        </div> 
                                    )}

                                    {/* GROUP: Detail Acara & Pengiriman - FIELD SEJAJAR */}
                                    <div className="space-y-6 p-6 border rounded-xl bg-gray-50/50 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-700 flex items-center border-b pb-3"><CalendarDays className="h-5 w-5 mr-2 text-blue-600"/> Detail Acara & Pengiriman</h3>
                                        
                                        {/* Baris 1: Nama Acara (Full Width) */}
                                        <div className="space-y-2">
                                            <Label htmlFor="acara">Nama Acara</Label>
                                            <SearchableSelect placeholder="Pilih atau ketik jenis acara" options={uniqueAcaraOptions} value={acaraValue} onChange={(val) => form.setValue("acara", val, { shouldValidate: true })} error={!!form.formState.errors.acara} />
                                            {form.formState.errors.acara && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.acara.message}</p> )}
                                        </div>
                                        
                                        {/* Baris 2: Tanggal & Waktu (Grid 3 Kolom) */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Field Tgl. Pengiriman */}
                                            <div className="space-y-2">
                                                <Label htmlFor="tanggalPengiriman">Tgl. Pengiriman (Min. H+1)</Label>
                                                <Input id="tanggalPengiriman" type="date" {...form.register("tanggalPengiriman")} error={!!form.formState.errors.tanggalPengiriman} />
                                                {form.formState.errors.tanggalPengiriman && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.tanggalPengiriman.message}</p> )}
                                            </div>
                                            
                                            {/* Field Waktu */}
                                            <div className="space-y-2">
                                                <Label htmlFor="waktu">Waktu</Label>
                                                <Controller
                                                    control={form.control}
                                                    name="waktu"
                                                    render={({ field }) => (
                                                        <SearchableSelect 
                                                            placeholder="Pilih waktu" 
                                                            options={waktuOptions} 
                                                            value={field.value} 
                                                            // LOGIC: Panggil autoFillJam di onChange
                                                            onChange={(val) => autoFillJam(val, field.onChange)} 
                                                            error={!!form.formState.errors.waktu} 
                                                        />
                                                    )}
                                                />
                                                {form.formState.errors.waktu && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.waktu.message}</p> )}
                                            </div>
                                            
                                            {/* Field Jam Pengiriman (Bisa Diubah) */}
                                            <div className="space-y-2">
                                                <Label htmlFor="jamPengiriman">Jam Pengiriman (Bisa Diubah)</Label>
                                                <Input id="jamPengiriman" type="time" {...form.register("jamPengiriman")} className={cn(!!form.formState.errors.jamPengiriman && "border-red-500")} error={!!form.formState.errors.jamPengiriman} />
                                                {form.formState.errors.jamPengiriman && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.jamPengiriman.message}</p> )}
                                            </div>
                                        </div>

                                        {/* Baris 3: Lokasi & Tamu (Grid 2 Kolom) */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Field Lokasi */}
                                            <div className="space-y-2">
                                                <Label htmlFor="lokasi">Lokasi</Label>
                                                <SearchableSelect placeholder="Pilih atau ketik lokasi" options={lokasiOptions} value={lokasiValue} onChange={(val) => form.setValue("lokasi", val, { shouldValidate: true })} error={!!form.formState.errors.lokasi} />
                                                {form.formState.errors.lokasi && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.lokasi.message}</p> )}
                                            </div>
                                            
                                            {/* Field Jenis Tamu */}
                                            <div className="space-y-2">
                                                <Label htmlFor="tamu">Jenis Tamu</Label>
                                                <SearchableSelect placeholder="Pilih jenis tamu" options={tamuOptions} value={tamuValue} onChange={(val) => form.setValue("tamu", val, { shouldValidate: true })} error={!!form.formState.errors.tamu} />
                                                {form.formState.errors.tamu && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.tamu.message}</p> )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* GROUP: Detail Pemesan & Approval - FIELD SEJAJAR */}
                                    <div className="space-y-6 p-6 border rounded-xl bg-gray-50/50 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-700 flex items-center border-b pb-3"><UserCircle className="h-5 w-5 mr-2 text-blue-600"/> Detail Pemesan & Approval</h3>
                                        
                                        {/* Baris 1: Pengaju, Bagian, Approval (Grid 3 Kolom) */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2"><Label htmlFor="yangMengajukan">Yang Mengajukan (Disabled)</Label><Input id="yangMengajukan" {...form.register("yangMengajukan")} disabled className="bg-gray-100" error={!!form.formState.errors.yangMengajukan} />{form.formState.errors.yangMengajukan && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.yangMengajukan.message}</p> )}</div>
                                            <div className="space-y-2"><Label htmlFor="untukBagian">Untuk Bagian</Label><SearchableSelect placeholder="Pilih bagian" options={bagianOptions} value={bagianValue} onChange={(val) => form.setValue("untukBagian", val, { shouldValidate: true })} error={!!form.formState.errors.untukBagian} />{form.formState.errors.untukBagian && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.untukBagian.message}</p> )}</div>
                                            <div className="space-y-2"><Label htmlFor="approval">Approval</Label><SearchableSelect placeholder="Pilih approval" options={approvalOptions} value={approvalValue} onChange={(val) => form.setValue("approval", val, { shouldValidate: true })} error={!!form.formState.errors.approval} />{form.formState.errors.approval && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.approval.message}</p> )}</div>
                                        </div>

                                        {/* Baris 2: Tanggal Permintaan (Grid 1 Kolom) */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2 col-span-1 md:col-span-1"><Label htmlFor="tanggalPermintaan">Tanggal Permintaan (Auto)</Label><Input id="tanggalPermintaan" type="date" {...form.register("tanggalPermintaan")} disabled className="bg-gray-100" error={!!form.formState.errors.tanggalPermintaan} /></div>
                                        </div>
                                    </div>

                                    {/* GROUP: Detail Konsumsi - Item Konsumsi Sejajar */}
                                    <div className="space-y-5 p-6 border rounded-xl bg-blue-50/70 shadow-inner border-blue-200">
                                        <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                                            <h3 className="text-xl font-bold text-blue-800 flex items-center"><Utensils className="h-5 w-5 mr-2 text-blue-600"/> Detail Konsumsi</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-gray-700">Total Qty: <span className="text-blue-600 font-bold text-lg">{totalQty}</span></span>
                                                <Button type="button" size="sm" onClick={() => append({ id: "", jenis: "", qty: "1" })} className="transition-all duration-200 bg-green-500 hover:bg-green-600 shadow-green-500/30"><Plus className="h-4 w-4 mr-1.5"/>Tambah Item</Button>
                                            </div>
                                        </div>
                                        
                                        {form.formState.errors.konsumsi?.root && ( <p className="text-sm font-medium text-red-500 pt-1">{form.formState.errors.konsumsi.root.message}</p> )}
                                        
                                        <div className="space-y-4 pt-2">
                                            {fields.map((field, index) => ( 
                                                // Item Konsumsi Card - Flex di HP (vertikal) dan Flex di SM (horizontal)
                                                <div key={field.id} className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 pr-4 bg-white rounded-lg border border-gray-200 shadow-md transition-shadow hover:shadow-lg">
                                                    
                                                    {/* Tombol Hapus - Absolute di Pojok Kanan Atas (Besar) */}
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} 
                                                        className="absolute top-2 right-2 text-red-500 hover:bg-red-50 hover:text-red-600 p-0 h-10 w-10 rounded-full bg-red-100/50 hover:bg-red-200 z-10" 
                                                        disabled={fields.length <= 1}
                                                    >
                                                        <Trash2 className="h-6 w-6"/> {/* Ikon lebih besar (h-6 w-6) */}
                                                    </Button>
                                                    
                                                    {/* Kontainer Utama Item (Image + Input Group) */}
                                                    <div className="flex flex-col sm:flex-row w-full items-start sm:items-center gap-4">
                                                        
                                                        {/* Image Watcher/Item Label - Flex-shrink-0 */}
                                                        <div className="w-20 flex-shrink-0 pt-1 flex items-start sm:self-start"> 
                                                            <KonsumsiImageWatcher control={form.control} index={index} />
                                                        </div>
                                                        
                                                        {/* Kontainer Input (Jenis Konsumsi & Kuantitas) */}
                                                        {/* Grid 2 kolom di HP, Grid 5 kolom di desktop */}
                                                        <div className="grid grid-cols-2 gap-4 flex-1 w-full sm:w-auto sm:grid-cols-5 sm:gap-4 sm:pr-12">
                                                            
                                                            {/* Jenis Konsumsi (2/2 di HP, 3/5 di SM+) */}
                                                            <div className="w-full space-y-1 col-span-2 sm:col-span-3">
                                                                <Label htmlFor={`konsumsi.${index}.id`} className="text-xs font-medium text-gray-600">Jenis Konsumsi</Label>
                                                                <Controller control={form.control} name={`konsumsi.${index}.id`} 
                                                                    render={({ field: { onChange, value } }) => ( 
                                                                        <SearchableSelect placeholder="(Wajib) Pilih Jenis" options={dynamicJenisKonsumsiOptions} value={value} 
                                                                            onChange={(selectedId) => { 
                                                                                const selectedOption = dynamicJenisKonsumsiOptions.find(opt => opt.value === selectedId); 
                                                                                onChange(selectedId); 
                                                                                form.setValue(`konsumsi.${index}.jenis`, selectedOption ? selectedOption.label : '', { shouldValidate: true }); 
                                                                            }} 
                                                                            error={!!form.formState.errors.konsumsi?.[index]?.id} 
                                                                        /> 
                                                                    )} 
                                                                />
                                                                {form.formState.errors.konsumsi?.[index]?.id && ( <p className="text-xs text-red-500 mt-1">{form.formState.errors.konsumsi?.[index]?.id?.message}</p> )}
                                                            </div>
                                                            
                                                            {/* Kuantitas (2/2 di HP, 2/5 di SM+) */}
                                                            <div className="w-full space-y-1 col-span-2 sm:col-span-2">
                                                                <Label htmlFor={`konsumsi.${index}.qty`} className="text-xs font-medium text-gray-600">Kuantitas</Label>
                                                                <Controller control={form.control} name={`konsumsi.${index}.qty`} 
                                                                    render={({ field }) => ( 
                                                                        <QtyStepper value={field.value} onChange={field.onChange} error={!!form.formState.errors.konsumsi?.[index]?.qty} /> 
                                                                    )} 
                                                                />
                                                                {form.formState.errors.konsumsi?.[index]?.qty && ( <p className="text-xs text-red-500 mt-1">{form.formState.errors.konsumsi?.[index]?.qty?.message}</p> )}
                                                            </div>
                                                            
                                                        </div>
                                                    </div>
                                                </div> 
                                            ))}
                                        </div>
                                        
                                        <div className="space-y-2 pt-4 border-t border-blue-200/60 mt-4">
                                            <Label htmlFor="catatan">Catatan Tambahan (Opsional)</Label>
                                            <Input id="catatan" {...form.register("catatan")} placeholder="Contoh: 5 porsi vegetarian, 2 tidak pedas" error={!!form.formState.errors.catatan} />
                                            {form.formState.errors.catatan && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.catatan.message}</p> )}
                                        </div>
                                    </div>

                                </form>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-6 mt-6">
                                <Button variant="outline" onClick={onReturnToDashboard}>Batal & Kembali</Button>
                                <Button variant="primary" onClick={form.handleSubmit(handleNextStep)}>Konfirmasi & Kirim Pesanan</Button>
                            </CardFooter>
                        </Card>
                    </FormStep>
                    
                    <FormStep key={2} step={2} currentStep={step}>
                        <Card className="max-w-4xl mx-auto">
                            <CardHeader><CardTitle>Review Pesanan Anda</CardTitle><CardDescription>Pastikan semua data di bawah ini sudah benar sebelum mengirim.</CardDescription></CardHeader>
                            <CardContent className="space-y-8">
                                
                                {/* Detail Acara & Pengiriman */}
                                <div className="space-y-4 p-6 border rounded-xl bg-gray-50 shadow-lg shadow-gray-100">
                                    <h4 className="text-lg font-bold text-gray-800 flex items-center pb-3 border-b border-gray-200"><CalendarDays className="w-5 h-5 mr-2 text-blue-600" />Detail Acara & Pengiriman</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-2">
                                        <ReviewItem label={labels.acara} value={values.acara} icon={<ClipboardList className="w-5 h-5" />} />
                                        <ReviewItem label={labels.tamu} value={values.tamu.charAt(0).toUpperCase() + values.tamu.slice(1)} icon={<Users className="w-5 h-5" />} className="capitalize" />
                                        <ReviewItem label={labels.lokasi} value={values.lokasi} icon={<MapPin className="w-5 h-5" />} />
                                        <ReviewItem label={labels.tanggalPengiriman} value={values.tanggalPengiriman} icon={<CalendarDays className="w-5 h-5" />} />
                                        <ReviewItem label={labels.waktu} value={values.waktu} icon={<Clock className="w-5 h-5" />} />
                                        <ReviewItem label={labels.jamPengiriman} value={values.jamPengiriman} icon={<Clock className="w-5 h-5" />} />
                                    </div>
                                </div>

                                {/* Detail Pemesan & Approval */}
                                <div className="space-y-4 p-6 border rounded-xl bg-gray-50 shadow-lg shadow-gray-100">
                                    <h4 className="text-lg font-bold text-gray-800 flex items-center pb-3 border-b border-gray-200"><UserCircle className="w-5 h-5 mr-2 text-blue-600" />Detail Pemesan & Approval</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-2">
                                        <ReviewItem label={labels.yangMengajukan} value={values.yangMengajukan} icon={<UserCircle className="w-5 h-5" />} />
                                        <ReviewItem label={labels.untukBagian} value={values.untukBagian} icon={<ClipboardList className="w-5 h-5" />} />
                                        <ReviewItem label={labels.approval} value={values.approval} icon={<CheckCircle2 className="w-5 h-5" />} />
                                    </div>
                                </div>

                                {/* Ringkasan Item Konsumsi */}
                                <div className="space-y-4 p-6 border rounded-xl bg-blue-50/70 shadow-lg shadow-blue-100 border-blue-200">
                                    <h4 className="text-lg font-bold text-blue-800 flex items-center pb-3 border-b border-blue-200"><Utensils className="w-5 h-5 mr-2 text-blue-600" />Ringkasan Item Konsumsi (<span className="text-blue-600 text-xl ml-1">{totalQty}</span> Total)</h4>
                                    <div className="space-y-3 pt-2">
                                        {values.konsumsi.map((item, index) => { 
                                            const masterItem = getKonsumsiById(item.id); 
                                            const displayName = masterItem ? masterItem.nama : item.jenis; 
                                            return ( 
                                                <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <img src={masterItem?.img || 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=N/A'} alt={displayName} className="h-14 w-14 rounded-md object-cover border bg-gray-200" onError={(e) => e.target.src = 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=Img Error'} />
                                                    <div className="flex-1">
                                                        <span className="font-semibold text-gray-800 text-base">{displayName}</span>
                                                        <span className="block text-xs text-gray-500">{masterItem ? `Level Tamu: ${Object.keys(TINGKAT_TAMU).find(k => TINGKAT_TAMU[k] === masterItem.tamuMinLevel) || 'N/A'}` : 'Info level tidak tersedia'}</span>
                                                    </div>
                                                    <span className="text-2xl font-extrabold text-blue-600 px-2 flex-shrink-0">{item.qty}x</span>
                                                </div> 
                                            ); 
                                        })}
                                    </div>
                                </div>

                                {/* Catatan Tambahan */}
                                {values.catatan && ( 
                                    <div className="space-y-4 p-6 border rounded-xl bg-gray-50 shadow-lg shadow-gray-100">
                                        <h4 className="text-lg font-bold text-gray-800 flex items-center pb-3 border-b border-gray-200"><FileText className="w-5 h-5 mr-2 text-blue-600" />Catatan Tambahan</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap italic pt-2">{values.catatan}</p>
                                    </div> 
                                )}

                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-6 mt-6">
                                <Button variant="outline" onClick={handlePrevStep}>Kembali Edit</Button>
                                <Button variant="primary" onClick={form.handleSubmit(handleFinalSubmit)}>Konfirmasi & Kirim Pesanan</Button>
                            </CardFooter>
                        </Card>
                    </FormStep>
                    
                    <FormStep key={2} step={2} currentStep={step}>
                        <Card className="max-w-4xl mx-auto">
                            <CardHeader><CardTitle>Review Pesanan Anda</CardTitle><CardDescription>Pastikan semua data di bawah ini sudah benar sebelum mengirim.</CardDescription></CardHeader>
                            <CardContent className="space-y-8">
                                
                                {/* Detail Acara & Pengiriman */}
                                <div className="space-y-4 p-6 border rounded-xl bg-gray-50 shadow-lg shadow-gray-100">
                                    <h4 className="text-lg font-bold text-gray-800 flex items-center pb-3 border-b border-gray-200"><CalendarDays className="w-5 h-5 mr-2 text-blue-600" />Detail Acara & Pengiriman</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-2">
                                        <ReviewItem label={labels.acara} value={values.acara} icon={<ClipboardList className="w-5 h-5" />} />
                                        <ReviewItem label={labels.tamu} value={values.tamu.charAt(0).toUpperCase() + values.tamu.slice(1)} icon={<Users className="w-5 h-5" />} className="capitalize" />
                                        <ReviewItem label={labels.lokasi} value={values.lokasi} icon={<MapPin className="w-5 h-5" />} />
                                        <ReviewItem label={labels.tanggalPengiriman} value={values.tanggalPengiriman} icon={<CalendarDays className="w-5 h-5" />} />
                                        <ReviewItem label={labels.waktu} value={values.waktu} icon={<Clock className="w-5 h-5" />} />
                                        <ReviewItem label={labels.jamPengiriman} value={values.jamPengiriman} icon={<Clock className="w-5 h-5" />} />
                                    </div>
                                </div>

                                {/* Detail Pemesan & Approval */}
                                <div className="space-y-4 p-6 border rounded-xl bg-gray-50 shadow-lg shadow-gray-100">
                                    <h4 className="text-lg font-bold text-gray-800 flex items-center pb-3 border-b border-gray-200"><UserCircle className="w-5 h-5 mr-2 text-blue-600" />Detail Pemesan & Approval</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 pt-2">
                                        <ReviewItem label={labels.yangMengajukan} value={values.yangMengajukan} icon={<UserCircle className="w-5 h-5" />} />
                                        <ReviewItem label={labels.untukBagian} value={values.untukBagian} icon={<ClipboardList className="w-5 h-5" />} />
                                        <ReviewItem label={labels.approval} value={values.approval} icon={<CheckCircle2 className="w-5 h-5" />} />
                                    </div>
                                </div>

                                {/* Ringkasan Item Konsumsi */}
                                <div className="space-y-4 p-6 border rounded-xl bg-blue-50/70 shadow-lg shadow-blue-100 border-blue-200">
                                    <h4 className="text-lg font-bold text-blue-800 flex items-center pb-3 border-b border-blue-200"><Utensils className="w-5 h-5 mr-2 text-blue-600" />Ringkasan Item Konsumsi (<span className="text-blue-600 text-xl ml-1">{totalQty}</span> Total)</h4>
                                    <div className="space-y-3 pt-2">
                                        {values.konsumsi.map((item, index) => { 
                                            const masterItem = getKonsumsiById(item.id); 
                                            const displayName = masterItem ? masterItem.nama : item.jenis; 
                                            return ( 
                                                <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <img src={masterItem?.img || 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=N/A'} alt={displayName} className="h-14 w-14 rounded-md object-cover border bg-gray-200" onError={(e) => e.target.src = 'https://placehold.co/200x200/CCCCCC/FFFFFF?text=Img Error'} />
                                                    <div className="flex-1">
                                                        <span className="font-semibold text-gray-800 text-base">{displayName}</span>
                                                        <span className="block text-xs text-gray-500">{masterItem ? `Level Tamu: ${Object.keys(TINGKAT_TAMU).find(k => TINGKAT_TAMU[k] === masterItem.tamuMinLevel) || 'N/A'}` : 'Info level tidak tersedia'}</span>
                                                    </div>
                                                    <span className="text-2xl font-extrabold text-blue-600 px-2 flex-shrink-0">{item.qty}x</span>
                                                </div> 
                                            ); 
                                        })}
                                    </div>
                                </div>

                                {/* Catatan Tambahan */}
                                {values.catatan && ( 
                                    <div className="space-y-4 p-6 border rounded-xl bg-gray-50 shadow-lg shadow-gray-100">
                                        <h4 className="text-lg font-bold text-gray-800 flex items-center pb-3 border-b border-gray-200"><FileText className="w-5 h-5 mr-2 text-blue-600" />Catatan Tambahan</h4>
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap italic pt-2">{values.catatan}</p>
                                    </div> 
                                )}

                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-6 mt-6">
                                <Button variant="outline" onClick={handlePrevStep}>Kembali Edit</Button>
                                <Button variant="primary" onClick={form.handleSubmit(handleFinalSubmit)}>Konfirmasi & Kirim Pesanan</Button>
                            </CardFooter>
                        </Card>
                    </FormStep>
                    
                    <FormStep key={3} step={3} currentStep={step}>
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center bg-white p-10 rounded-2xl shadow-2xl border border-gray-100 max-w-md mx-auto">
                            <div className="text-green-500 w-24 h-24 mx-auto mb-6 flex items-center justify-center bg-green-100 rounded-full ring-4 ring-green-200">
                                <CheckCircle2 className="w-16 h-16" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-800 mb-2">Pemesanan Berhasil! 🎉</h2>
                            <p className="text-gray-600 mt-2 text-base">Pesanan Anda telah berhasil dikirimkan. Silakan tunggu notifikasi persetujuan dari PIC Approval.</p>
                            <Button onClick={onReturnToDashboard} className="mt-8 px-8 py-3 text-base">Selesai & Kembali ke Menu Utama</Button>
                        </motion.div>
                    </FormStep>
                </AnimatePresence>
            </div>
        </div>
    );
};

// Wrapper agar dapat dirender di lingkungan terisolasi
const AppWrapper = () => {
    // Simulasi state dan handler yang dibutuhkan komponen
    const handleFormSubmit = (data) => console.log("Pesanan dikirim:", data);
    const handleReturn = () => alert("Kembali ke menu utama (Simulasi)");

    return (
        <PemesananForm 
            onFormSubmit={handleFormSubmit} 
            onReturnToDashboard={handleReturn} 
            riwayat={DUMMY_RIWAYAT} 
        />
    );
};

export default AppWrapper;
