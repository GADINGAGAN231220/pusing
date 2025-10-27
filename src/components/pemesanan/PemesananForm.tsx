import React, { useState, useMemo, useEffect, forwardRef, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Impor hook form, zod, dll.
import { useForm, useFieldArray, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// --- UTILITY: Class Name Merger ---
function cn(...inputs: (string | number | boolean | null | undefined | (string | number | boolean | null | undefined)[] | { [key: string]: any })[]) {
    const classes = new Set<string>();
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

// --- DATA KONSUMSI MASTER ---
const TINGKAT_TAMU: Record<string, number> = { 'standar': 1, 'reguler': 2, 'perta': 3, 'vip': 4, 'vvip': 5 };
const MASTER_KONSUMSI = [
    { id: 'std-nasi', nama: 'Nasi Box Standar', tamuMinLevel: 1, allowedWaktu: ['Siang', 'Malam', 'Tengah Malam'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Nasi+Std', defaultSatuan: 'kotak' },
    { id: 'std-snack', nama: 'Snack Box Standar', tamuMinLevel: 1, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa', 'Snack malam'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Snack+Std', defaultSatuan: 'box' },
    { id: 'std-kopi', nama: 'Kopi & Teh (Sachet)', tamuMinLevel: 1, allowedWaktu: ['Pagi', 'Sore', 'Snack malam', 'Tengah Malam', 'Sahur'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Kopi', defaultSatuan: 'pax' },
    { id: 'reg-nasi', nama: 'Nasi Box Reguler', tamuMinLevel: 2, allowedWaktu: ['Siang', 'Malam', 'Tengah Malam'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Nasi+Reg', defaultSatuan: 'kotak' },
    { id: 'reg-snack', nama: 'Snack Box Reguler', tamuMinLevel: 2, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa', 'Snack malam'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Snack+Reg', defaultSatuan: 'box' },
    { id: 'reg-prasmanan', nama: 'Prasmanan Reguler', tamuMinLevel: 2, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa', 'Sahur'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Prasmanan', defaultSatuan: 'pax' },
    { id: 'perta-nasi', nama: 'Nasi Box Perta', tamuMinLevel: 3, allowedWaktu: ['Siang', 'Malam', 'Tengah Malam'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Nasi+Perta', defaultSatuan: 'kotak' },
    { id: 'vip-prasmanan', nama: 'Prasmanan VIP', tamuMinLevel: 4, allowedWaktu: ['Siang', 'Malam', 'Buka Puasa', 'Sahur'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Prasmanan+VIP', defaultSatuan: 'pax' },
    { id: 'vvip-snack', nama: 'Snack VVIP (High Tea)', tamuMinLevel: 5, allowedWaktu: ['Pagi', 'Sore', 'Buka Puasa', 'Snack malam'], img: 'https://placehold.co/100x100/F0F9FF/007AFF?text=Snack+VVIP', defaultSatuan: 'set' },
];
const getKonsumsiById = (id: string) => id ? MASTER_KONSUMSI.find(item => item.id === id) : undefined;

// Dummy data untuk riwayat
const DUMMY_RIWAYAT = [
    { id: 'ord-2', acara: 'Pelatihan Internal TI', tanggalPermintaan: '2025-10-21', tanggalPengiriman: '2025-10-28', waktu: 'Siang', jamPengiriman: '12:30', lokasi: 'Ruang Training C', tamu: 'standar', yangMengajukan: 'Riza Ilhamsyah', untukBagian: 'Dep. TI', approval: 'Jojok Satriadi (1140122)', konsumsi: [{ id: 'std-nasi', jenis: 'Nasi Box Standar', qty: '25', satuan: 'kotak' }, { id: 'std-kopi', jenis: 'Kopi & Teh (Sachet)', qty: '25', satuan: 'pax' }], status: 'Disetujui', statusHistory: [] },
];

// --- SCHEMA DEFINITION ---
const isTomorrowOrLater = (dateString: string) => { const today = new Date(); const selectedDate = new Date(dateString); today.setHours(0, 0, 0, 0); selectedDate.setHours(0, 0, 0, 0); const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1); return selectedDate >= tomorrow; };

// PERUBAHAN: Satuan menjadi wajib
const konsumsiItemFormSchema = z.object({
    id: z.string().min(1, "Jenis konsumsi harus dipilih."),
    jenis: z.string().optional(),
    satuan: z.string().min(1, "Satuan harus dipilih."), // Dibuat wajib
    qty: z.string().refine((val) => /^\d+$/.test(val) && parseInt(val, 10) > 0, { message: "Qty harus > 0." }), // Ubah pesan error
});

const formSchema = z.object({
    acara: z.string().min(3, "Nama acara minimal 3 karakter."),
    tanggalPermintaan: z.string().refine(v => !isNaN(Date.parse(v)), "Tanggal permintaan tidak valid."),
    tanggalPengiriman: z.string().refine(v => !isNaN(Date.parse(v)), "Tanggal pengiriman tidak valid.").refine(isTomorrowOrLater, "Tanggal pengiriman minimal H+1."),
    waktu: z.string().min(1, "Waktu harus dipilih."),
    jamPengiriman: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format jam tidak valid (HH:MM)").optional().or(z.literal("")),
    lokasi: z.string().min(3, "Lokasi minimal 3 karakter."),
    tamu: z.string().min(1, "Jenis tamu wajib diisi."),
    yangMengajukan: z.string().min(3, "Pengaju harus diisi."),
    untukBagian: z.string().min(3, "Bagian harus dipilih."),
    approval: z.string().min(3, "Approval harus dipilih."),
    konsumsi: z.array(konsumsiItemFormSchema).min(1, "Minimal harus ada 1 item konsumsi."),
    catatan: z.string().optional(),
});

type PemesananFormData = z.infer<typeof formSchema>;

// --- KOMPONEN UI DASAR & IKON ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost'; size?: 'default' | 'sm' | 'lg'; }
const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'primary', size = 'default', ...props }, ref) => { const base = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none transform"; const variants = { primary: "bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-xl hover:scale-[1.02]", destructive: "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 hover:shadow-xl hover:scale-[1.02]", outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600 hover:scale-[1.01]", secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300/80 hover:scale-[1.01]", ghost: "hover:bg-gray-100 text-gray-600 hover:text-blue-600 hover:scale-[1.01]" }; const sizes = { default: "h-10 py-2 px-4", sm: "h-9 px-3 rounded-md", lg: "h-11 px-8 rounded-lg" }; return <button className={cn(base, variants[variant as keyof typeof variants], sizes[size as keyof typeof sizes], className)} ref={ref} {...props} />; });
Button.displayName = 'Button';
const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("rounded-xl border border-gray-100 bg-white text-slate-900 shadow-2xl shadow-gray-200/50", className)} {...props} />);
Card.displayName = 'Card';
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ children, className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6 bg-blue-50/50 border-b border-blue-100 rounded-t-xl", className)} {...props}>{children}</div>);
CardHeader.displayName = 'CardHeader';
const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, children, ...props }, ref) => <h3 ref={ref} className={cn("text-2xl font-bold leading-none tracking-tight text-blue-800", className)} {...props}>{children}</h3>);
CardTitle.displayName = 'CardTitle';
const CardDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className, ...props }, ref) => <p ref={ref} className={cn("text-sm text-blue-700", className)} {...props} />);
CardDescription.displayName = 'CardDescription';
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-6", className)} {...props}>{children}</div>);
CardContent.displayName = 'CardContent';
const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-6 border-t border-slate-100 justify-between", className)} {...props} />);
CardFooter.displayName = 'CardFooter';
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { error?: boolean; }
const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => <input className={cn( "flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-90 disabled:bg-gray-100", error && "border-red-500 focus:ring-red-500", className )} ref={ref} {...props} />);
Input.displayName = 'Input';
const Label = forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({ className, ...props }, ref) => <label ref={ref} className={cn("text-sm font-medium leading-none text-gray-700", className)} {...props} />);
Label.displayName = 'Label';

// Icons
type IconProps = { className?: string };
const CheckCircle2 = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" /></svg>;
const ChevronDown = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>;
const SearchIcon = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>;
const Trash2 = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>;
const Plus = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const Minus = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="5" x2="19" y1="12" y2="12"/></svg>;
const CalendarDays = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>;
const UserCircle = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/><circle cx="12" cy="12" r="10"/></svg>;
const Utensils = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M15 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M8 22v-4M18 22v-4M12 22V2"/></svg>;
const FileText = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>;
const Clock = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
const MapPin = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="12" r="3"/></svg>;
const Users = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const ClipboardList = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>;
const BoxIcon = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>;
const HashIcon = ({ className = "" }: IconProps) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>;

// Komponen Form Step
const FormStep: React.FC<{ children: React.ReactNode; step: number; currentStep: number }> = ({ children, step, currentStep }) => {
    if (step !== currentStep) return null;
    return (<motion.div initial={{ opacity: 0, x: 20 * (step - currentStep) }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 * (step - currentStep) }} transition={{ duration: 0.3, ease: "easeInOut" }} className="mb-8">{children}</motion.div>);
};


// Komponen Searchable Select
interface SelectOption { label: string; value: string | number; }
interface SearchableSelectProps {
    options: SelectOption[];
    value: string | number | null;
    onChange: (value: string | number | null) => void;
    placeholder?: string;
    error?: boolean;
}
const SearchableSelect: React.FC<SearchableSelectProps> = ({ options = [], value, onChange, placeholder = "Pilih opsi...", error }) => {
    const [search, setSearch] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const filteredOptions = useMemo(() => options.filter(opt => opt.label?.toLowerCase().includes(search.toLowerCase())), [options, search]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => { if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false); };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => { if (isOpen && searchInputRef.current) searchInputRef.current.focus(); }, [isOpen]);

    const handleOptionClick = (val: string | number | null) => { onChange(val); setSearch(""); setIsOpen(false); };
    const selectedLabel = options.find(opt => opt.value === value)?.label || "";

    return (
        <div className="relative w-full" ref={containerRef}>
            <button type="button" className={cn("flex h-10 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm transition duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500", !selectedLabel && "text-gray-400", error && "border-red-500 focus:ring-red-500")} onClick={() => setIsOpen(!isOpen)}>
                <span className={cn("truncate", !selectedLabel && "text-gray-400")}>{selectedLabel || placeholder}</span>
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
                                <div key={option.value + '-' + index} onClick={() => handleOptionClick(option.value)} className={cn("cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-700", value === option.value && "bg-blue-100 text-blue-800 font-medium")}>
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


// Komponen Qty Stepper
interface QtyStepperProps {
    value: string;
    onChange: (value: string) => void;
    error?: boolean;
}
const QtyStepper: React.FC<QtyStepperProps> = ({ value, onChange, error }) => {
    const numValue = parseInt(value, 10) || 0;
    const handleIncrement = () => { onChange(String(numValue + 1)); };
    const handleDecrement = () => { if (numValue > 1) onChange(String(numValue - 1)); };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        if (/^\d*$/.test(rawValue)) {
            const intValue = parseInt(rawValue, 10);
            if (rawValue === "") { onChange("0"); }
            else if (!isNaN(intValue) && intValue >= 0) { onChange(String(intValue)); }
        }
    };
     const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const currentValue = parseInt(e.target.value, 10) || 0;
        if (currentValue < 1) { onChange("1"); }
    };

    return (
        <div className={cn("flex items-center w-full h-10 rounded-lg border border-gray-300 bg-white transition-all overflow-hidden focus-within:ring-2 focus-within:ring-blue-500", error && "border-red-500 focus-within:ring-red-500")}>
            <Button type="button" variant="ghost" size="sm" className="h-full w-10 p-0 rounded-r-none border-r border-gray-300 text-gray-600 hover:bg-gray-100 flex-shrink-0 focus:z-10" onClick={handleDecrement} disabled={numValue <= 1}>
                <Minus className="h-5 w-5" />
            </Button>
            <input type="text" inputMode="numeric" value={String(numValue)} onChange={handleInputChange} onBlur={handleBlur} className="flex-1 text-center text-base font-semibold text-gray-900 min-w-[30px] border-none focus:ring-0 focus:outline-none h-full p-0" aria-label="Qty"/>
            <Button type="button" variant="ghost" size="sm" className="h-full w-10 p-0 rounded-l-none border-l border-gray-300 text-gray-600 hover:bg-gray-100 flex-shrink-0 focus:z-10" onClick={handleIncrement}>
                <Plus className="h-5 w-5" />
            </Button>
        </div>
    );
};

// Tipe props untuk PemesananForm
interface PemesananFormProps {
    riwayat?: any[];
    onFormSubmit: (data: PemesananFormData) => void;
    onReturnToDashboard: () => void;
}

// --- OPTIONS ---
// PERUBAHAN: Daftar Satuan diperbarui
const SATUAN_OPTIONS: SelectOption[] = [
    { label: "Botol", value: "Botol" },
    { label: "Box", value: "Box" },
    { label: "Bungkus", value: "Bungkus" },
    { label: "Butir", value: "Butir" },
    { label: "Cup", value: "Cup" },
    { label: "Dus", value: "Dus" },
    { label: "Galon", value: "Galon" },
    { label: "Keranjang", value: "Keranjang" },
    { label: "Kg", value: "Kg" },
    { label: "Kotak", value: "kotak"}, // Pastikan lowercase konsisten jika value beda
    { label: "Krat", value: "Krat" },
    { label: "Pack", value: "Pack" }, // Ganti ke Pack
    { label: "Pax", value: "pax"}, // Pastikan lowercase konsisten jika value beda
    { label: "Pcs", value: "Pcs" },
    { label: "Porsi", value: "Porsi" },
    { label: "Sachet", value: "Sachet" },
    { label: "Set", value: "Set" }, // Pastikan lowercase konsisten jika value beda
    { label: "Tampah", value: "Tampah" },
    { label: "Toples", value: "Toples" }, // Ditambahkan
    { label: "Tusuk", value: "Tusuk" },   // Ditambahkan
].sort((a, b) => a.label.localeCompare(b.label)); // Urutkan A-Z

// --- KOMPONEN FORM PEMESANAN UTAMA ---
const PemesananForm: React.FC<PemesananFormProps> = ({ riwayat = DUMMY_RIWAYAT, onFormSubmit = (data) => console.log('Form Submitted:', data), onReturnToDashboard = () => console.log('Kembali ke Dashboard (Dummy)') }) => {
    const [step, setStep] = useState(1);

    const form = useForm<PemesananFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: { acara: "", tanggalPermintaan: getTodayDate(), tanggalPengiriman: getTomorrowDate(), waktu: "", jamPengiriman: "", lokasi: "", tamu: "", yangMengajukan: "Riza Ilhamsyah (12231149)", untukBagian: "Dep. Teknologi Informasi PKC (C001370000)", approval: "", konsumsi: [{ id: "", jenis: "", satuan: "", qty: "1" }], catatan: "" },
        mode: "onBlur"
    });

    const { fields, append, remove } = useFieldArray({ control: form.control, name: "konsumsi" });
    const waktuValue = form.watch("waktu");
    const tamuValue = form.watch("tamu");
    const konsumsiValues = form.watch("konsumsi");
    const totalQty = useMemo(() => konsumsiValues.reduce((total, item) => total + (parseInt(item.qty, 10) || 0), 0), [konsumsiValues]);

    const dynamicJenisKonsumsiOptions = useMemo(() => {
        const levelTamu = TINGKAT_TAMU[tamuValue] || 0;
        if (!waktuValue || !tamuValue) return [];
        const filtered = MASTER_KONSUMSI.filter(item => item.tamuMinLevel <= levelTamu && item.allowedWaktu.includes(waktuValue));
        return filtered.map(item => ({ label: item.nama, value: item.id }));
    }, [waktuValue, tamuValue]);

    useEffect(() => {
        const currentKonsumsi = form.getValues('konsumsi');
        const validJenisIds = new Set(dynamicJenisKonsumsiOptions.map(opt => opt.value));
        currentKonsumsi.forEach((item, index) => {
            if (item.id && !validJenisIds.has(item.id)) {
                form.setValue(`konsumsi.${index}.id`, '', { shouldValidate: true });
                form.setValue(`konsumsi.${index}.jenis`, '', { shouldValidate: true });
                form.setValue(`konsumsi.${index}.satuan`, '', { shouldValidate: true }); // Reset & validasi satuan
            } else if (item.id && !item.satuan) { // Jika jenis valid tapi satuan kosong
                 const masterItem = getKonsumsiById(item.id);
                 // Coba isi default HANYA JIKA defaultSatuan ada di SATUAN_OPTIONS
                 const defaultExists = SATUAN_OPTIONS.some(opt => opt.value === masterItem?.defaultSatuan);
                 form.setValue(`konsumsi.${index}.satuan`, defaultExists ? masterItem?.defaultSatuan || '' : '', { shouldValidate: true }); // Validasi setelah mengisi default
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [waktuValue, tamuValue, dynamicJenisKonsumsiOptions]); // Hapus 'form' dari dependensi

    // Handler Perubahan Waktu (tanpa auto-fill jam)
    const handleWaktuChange = (selectedWaktu: string, fieldChange: (value: string) => void) => {
        fieldChange(selectedWaktu);
    };

    const riwayatOptions = useMemo(() => { if (!riwayat || riwayat.length === 0) return []; return riwayat.map((r, index) => ({ label: `${r.acara} (${r.tanggalPengiriman})`, value: index })); }, [riwayat]);
    const handleLoadFromRiwayat = (riwayatIndex: string | number | null) => {
        if (riwayatIndex === null || riwayatIndex === undefined) return;
        const selectedRiwayat = riwayat[riwayatIndex as number];
        if (!selectedRiwayat) return;
        form.reset({
            acara: selectedRiwayat.acara, lokasi: selectedRiwayat.lokasi, tamu: selectedRiwayat.tamu, waktu: selectedRiwayat.waktu,
            yangMengajukan: selectedRiwayat.yangMengajukan, untukBagian: selectedRiwayat.untukBagian, approval: selectedRiwayat.approval,
            catatan: selectedRiwayat.catatan || "",
            konsumsi: (selectedRiwayat.konsumsi || []).map((k: any) => ({ id: k.id || "", jenis: k.jenis || getKonsumsiById(k.id)?.nama || "", satuan: k.satuan || "", qty: k.qty || "1" })), // Jangan isi satuan otomatis saat load
            tanggalPermintaan: getTodayDate(), tanggalPengiriman: getTomorrowDate(), jamPengiriman: selectedRiwayat.jamPengiriman || "",
        });
        form.setValue("waktu", selectedRiwayat.waktu || "", { shouldValidate: true });
        form.setValue("tamu", selectedRiwayat.tamu || "", { shouldValidate: true });
        form.trigger();
    };

    // Opsi statis
    const uniqueAcaraOptions = useMemo(() => { const d = [ "Bahan Minum Karyawan", "Baporkes", "BK3N", "Extra fooding", "Extra Fooding Shift", "Extra Fooding SKJ", "Festival Inovasi", "Halal bil halal", "Rapat Koordinasi", "Pelatihan Internal", "Acara Departemen", "Lainnya" ]; const a = new Set([ ...d, ...(riwayat?.map((r) => r.acara) ?? []) ]); return Array.from(a).map((n) => ({ label: n as string, value: n as string })); }, [riwayat]);
    const waktuOptions = [ { label: "Sahur", value: "Sahur" }, { label: "Pagi", value: "Pagi" }, { label: "Siang", value: "Siang" }, { label: "Sore", value: "Sore" }, { label: "Buka Puasa", value: "Buka Puasa" }, { label: "Malam", value: "Malam" }, { label: "Snack malam", value: "Snack malam" }, { label: "Tengah Malam", value: "Tengah Malam" } ];
    const allLokasi = [ "Bagging", "CCB", "Club House", "Departemen Riset", "Gedung 101-K", "Gedung Anggrek", "Gedung Bidding Center", "Gedung Contraction Office", "Gedung K3", "Gedung LC", "Gedung Maintenance Office", "Gedung Mawar", "Gedung Melati", "Gedung Purna Bhakti", "Gedung Pusat Administrasi", "Gedung RPK", "Gedung Saorga", "GH-B", "GH-C", "GPA Lt-3", "Gudang bahan baku", "Gudang Bulk Material", "Gudang Suku Cadang", "Jakarta", "Kantor SP2K", "Kebon bibit", "Klinik PT HPH", "Kolam pancing type B", "Kolam renang", "Kujang Kampioen Riset", "Laboratorium / Main Lab", "Lapang Basket type B", "Lapang Futsal", "Lapang Sepak Bola Type E", "Lapang Tenis type B", "Lapang Volly type E", "Lapangan Helipad", "Lapangan Panahan", "Lapangan Volley", "Mekanik K1A", "Mekanik K1B", "Not defined", "NPK-2", "Pos Selatan 01", "Posko Pengamanan Bawah", "Ruang Rapat NPK-1", "Ruang Rapat NPK-2", "Utility K-1A", "Wisma Kujang", "Wisma Kujang, Aula Serbaguna", "Gedung Training Center, Ruang 1", "Ruang Meeting Cempaka, Gedung Utama", ];
    const uniqueLokasi = Array.from(new Set(allLokasi)).sort();
    const lokasiOptions = uniqueLokasi.map(l => ({ label: l, value: l }));
    const tamuOptions = [ { label: "Standar", value: "standar" }, { label: "Regular", value: "reguler" }, { label: "PERTA", value: "perta" }, { label: "VIP", value: "vip" }, { label: "VVIP", value: "vvip" } ];
    const bagianOptions = [ { label: "Dep. Teknologi Informasi PKC (C001370000)", value: "Dep. Teknologi Informasi PKC (C001370000)" }, { label: "Dep. Keuangan (C001380000)", value: "Dep. Keuangan (C001380000)" }, { label: "Dep. SDM (C001390000)", value: "Dep. SDM (C001390000)" } ];
    const allApprovers = [ "Raden Sulistyo (3072491)", "Henisya Permata Sari (3072498)", "Desra Heriman (3072531)", "Arief Darmawan (3072535)", "R. Idho Pramana Sembada (3072545)", "Shinta Narulita (3082579)", "Anggita Maya Septianingsih (3082589)", "Iswahyudi Mertosono (3082594)", "Agung Gustiawan (3092789)", "Eka Priyatna (3102904)", "Fika Hikmaturrahmman (3123195)", "Fulki Fathurrahman (3133253)", "Mohammad Arief Rachman (3932032)", "Fajar Nugraha (3022134)", "Andika Arif Kurniawan (3082592)", "Indra Irianto (3022136)", "Hikmat Rachmatullah (3072497)", "Freddy Harianto (3072526)", "Soni Ridho Atmaja (3082583)", "Sundawa (3133211)", "Danang Siswantoro (3052402)", "Ira Purnama Sari (3072489)", "Gina Amarilis (3082581)", "Mulky Wahyudy (3082590)", "Zaki Faishal Aziz (3042168)", "Yoyon Daryono (3072495)", "Rosy Indra Saputra (3072496)", "Lala (3072542)", "Ardhimas Yuda Baskoro (3042172)", "Toni Gunawan (3042332)", "Dady Rahman (3052404)", "Mita Yasmitahati (3072527)", "Refan Anggasatriya (3082597)", "Amin Puji Hariyanto (3133210)", "Luthfianto Ardian (3022127)", "Yayan Taryana (3123091)", "Nugraha Agung Wibowo (3133236)", "Febri Rubragandi N (3052400)", "Probo Condrosari (3072490)", "Kholiq Iman Santoso (3253473)", "Dian Ramdani (3082628)", "Dede Sopian (3072524)", "Mohamad Gani (3092756)", "Muhammad Ikhsan Anshori (3133237)", "Jojok Satriadi (1140122)", "Ibrahim Herlambang (3072488)", "Dian Risdiana (3072532)", "Sintawati (3092748)", "Muhammad Yudi Prasetyo (3072487)", "Muh. Arifin Hakim Nuryadin (3972097)", "Jondra (3052403)", "Kasmadi (3072494)", "Syarifudin (3052401)", "Handi Rustian (3072485)", "Andi Komara (3072517)", "Fian Adi Nugraha Suhara (3092755)", "Yara Budhi Widowati (3052394)", "Ronald Irwanto (3123084)", "Rahayu Ginanjar Siwi (3123205)", "Dodi Pramadi (3972081)" ];
    const uniqueApprovers = Array.from(new Set(allApprovers)).sort();
    const approvalOptions = uniqueApprovers.map(name => ({ label: name, value: name }));


    // Handle Submit
    const handleNextStep = async () => {
        const isValid = await form.trigger();
        if (isValid) { setStep(2); }
        else {
            console.error("Validasi Gagal:", form.formState.errors);
            const errorKeys = Object.keys(form.formState.errors);
             if (errorKeys.length > 0) {
                 try { // @ts-ignore
                     form.setFocus(errorKeys[0] as keyof PemesananFormData);
                 } catch (e) { console.error("Gagal fokus:", e); }
             }
        }
    };
    const handlePrevStep = () => setStep((prev) => prev - 1);
    const handleFinalSubmit = (values: PemesananFormData) => {
        const finalValuesWithNamaSatuan = { ...values, konsumsi: values.konsumsi.map(item => { const masterItem = getKonsumsiById(item.id); return { ...item, jenis: item.jenis || masterItem?.nama || 'N/A', satuan: item.satuan || 'unit' }; }) };
        onFormSubmit(finalValuesWithNamaSatuan as any);
        setStep(3);
    };

    const values = form.getValues();
    const labels: Record<keyof PemesananFormData | string, string> = { acara: "Nama Acara", tanggalPermintaan: "Tanggal Permintaan", tanggalPengiriman: "Tanggal Pengiriman", waktu: "Waktu", jamPengiriman: "Jam Pengiriman", lokasi: "Lokasi", tamu: "Jenis Tamu", yangMengajukan: "Yang Mengajukan", untukBagian: "Untuk Bagian", approval: "Approval", konsumsi: "Detail Konsumsi", catatan: "Catatan Tambahan" };
    const ReviewItem: React.FC<{ label: string; value: string | number | undefined; className?: string; icon?: React.ReactNode }> = ({ label, value, className = "", icon = null }) => ( <div className={cn("flex items-start text-sm", className)}> <div className="w-5 h-5 mr-3 mt-0.5 text-blue-500 flex-shrink-0">{icon}</div> <div className="flex-1"> <span className="block text-gray-500 text-xs uppercase tracking-wider">{label}</span> <span className="block font-semibold text-gray-900 break-words mt-0.5 text-base">{String(value) || "-"}</span> </div> </div> );

    return (
        <div className="bg-gray-50 min-h-screen font-['Poppins',_sans-serif] text-gray-900">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');`}</style>
            <div className="sticky top-0 z-20 bg-white shadow-lg py-5 mb-8 rounded-b-xl border-b border-gray-100 px-4"> {/* Stepper Header */}
                <div className="flex justify-center items-center gap-4 max-w-xl mx-auto">
                    {["Isi Form", "Review", "Selesai"].map((label, index) => (
                        <React.Fragment key={index}>
                            <div className="flex flex-col items-center gap-2">
                                <motion.div className="w-10 h-10 flex items-center justify-center rounded-full font-bold transition-all duration-500" style={{ backgroundColor: step > index + 1 ? '#10B981' : step === index + 1 ? '#2563EB' : '#E5E7EB', color: 'white', scale: step === index + 1 ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}> {step > index + 1 ? <CheckCircle2 className="w-6 h-6"/> : index + 1} </motion.div>
                                <p className={`text-sm font-semibold mt-1 ${step >= index + 1 ? "text-blue-800" : "text-gray-500"}`}>{label}</p>
                            </div>
                            {index < 2 && ( <div className="flex-1 h-1 rounded-full mt-[-20px] transition-all duration-500" style={{ backgroundColor: step > index + 1 ? '#10B981' : '#E5E7EB' }} /> )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
            <div className="p-4 sm:p-6 md:p-10"> {/* Form Content Wrapper */}
                <AnimatePresence mode="wait">
                    <FormStep key={1} step={1} currentStep={step}>
                        <Card className="mx-auto w-full md:max-w-4xl">
                            <CardHeader><CardTitle>Form Pemesanan Konsumsi</CardTitle><CardDescription>Isi detail acara Anda di bawah ini dengan lengkap.</CardDescription></CardHeader>
                            <CardContent>
                                <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                                    {/* Muat dari Riwayat */}
                                    {riwayatOptions.length > 0 && (
                                        <div className="space-y-3 p-4 bg-blue-50/70 rounded-xl border border-blue-200/50 shadow-inner">
                                            <Label htmlFor="loadRiwayat" className="font-bold text-blue-800 flex items-center"><ClipboardList className="h-5 w-5 mr-2"/> Muat dari Riwayat</Label>
                                            <SearchableSelect placeholder="Pilih pesanan sebelumnya untuk mengisi form..." options={riwayatOptions} value={null} onChange={(val) => handleLoadFromRiwayat(val)} error={false} />
                                        </div>
                                    )}
                                    {/* GROUP: Detail Acara & Pengiriman */}
                                    <div className="space-y-6 p-6 border rounded-xl bg-gray-50/50 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-700 flex items-center border-b pb-3"><CalendarDays className="h-5 w-5 mr-2 text-blue-600"/> Detail Acara & Pengiriman</h3>
                                        <div className="space-y-2">
                                            <Label htmlFor="acara">Nama Acara</Label>
                                            <Controller name="acara" control={form.control} render={({ field }) => (<SearchableSelect placeholder="Pilih atau ketik jenis acara" options={uniqueAcaraOptions} value={field.value} onChange={field.onChange} error={!!form.formState.errors.acara}/>)}/>
                                            {form.formState.errors.acara && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.acara.message}</p> )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="tanggalPengiriman">Tgl. Pengiriman (Min. H+1)</Label>
                                                <Input id="tanggalPengiriman" type="date" {...form.register("tanggalPengiriman")} error={!!form.formState.errors.tanggalPengiriman} />
                                                {form.formState.errors.tanggalPengiriman && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.tanggalPengiriman.message}</p> )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="waktu">Waktu</Label>
                                                <Controller control={form.control} name="waktu" render={({ field }) => (<SearchableSelect placeholder="Pilih waktu" options={waktuOptions} value={field.value} onChange={(val) => handleWaktuChange(val as string, field.onChange)} error={!!form.formState.errors.waktu}/>)}/>
                                                {form.formState.errors.waktu && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.waktu.message}</p> )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="jamPengiriman">Jam Pengiriman</Label>
                                                <Input id="jamPengiriman" type="time" {...form.register("jamPengiriman")} className={cn(!!form.formState.errors.jamPengiriman && "border-red-500")} error={!!form.formState.errors.jamPengiriman} />
                                                {form.formState.errors.jamPengiriman && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.jamPengiriman.message}</p> )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="lokasi">Lokasi</Label>
                                                <Controller name="lokasi" control={form.control} render={({ field }) => (<SearchableSelect placeholder="Pilih atau ketik lokasi" options={lokasiOptions} value={field.value} onChange={field.onChange} error={!!form.formState.errors.lokasi}/>)}/>
                                                {form.formState.errors.lokasi && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.lokasi.message}</p> )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tamu">Jenis Tamu</Label>
                                                <Controller name="tamu" control={form.control} render={({ field }) => (<SearchableSelect placeholder="Pilih jenis tamu" options={tamuOptions} value={field.value} onChange={field.onChange} error={!!form.formState.errors.tamu} />)}/>
                                                {form.formState.errors.tamu && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.tamu.message}</p> )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* GROUP: Detail Pemesan & Approval */}
                                    <div className="space-y-6 p-6 border rounded-xl bg-gray-50/50 shadow-sm">
                                        <h3 className="text-xl font-bold text-gray-700 flex items-center border-b pb-3"><UserCircle className="h-5 w-5 mr-2 text-blue-600"/> Detail Pemesan & Approval</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2"><Label htmlFor="yangMengajukan">Yang Mengajukan (Disabled)</Label><Input id="yangMengajukan" {...form.register("yangMengajukan")} disabled className="bg-gray-100" error={!!form.formState.errors.yangMengajukan} />{form.formState.errors.yangMengajukan && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.yangMengajukan.message}</p> )}</div>
                                            <div className="space-y-2">
                                                <Label htmlFor="untukBagian">Untuk Bagian</Label>
                                                <Controller name="untukBagian" control={form.control} render={({ field }) => (<SearchableSelect placeholder="Pilih bagian" options={bagianOptions} value={field.value} onChange={field.onChange} error={!!form.formState.errors.untukBagian}/>)}/>
                                                {form.formState.errors.untukBagian && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.untukBagian.message}</p> )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="approval">Approval</Label>
                                                <Controller name="approval" control={form.control} render={({ field }) => (<SearchableSelect placeholder="Pilih approval" options={approvalOptions} value={field.value} onChange={field.onChange} error={!!form.formState.errors.approval}/>)}/>
                                                {form.formState.errors.approval && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.approval.message}</p> )}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="space-y-2 col-span-1 md:col-span-1"><Label htmlFor="tanggalPermintaan">Tanggal Permintaan (Auto)</Label><Input id="tanggalPermintaan" type="date" {...form.register("tanggalPermintaan")} disabled className="bg-gray-100" error={!!form.formState.errors.tanggalPermintaan} /></div>
                                        </div>
                                    </div>
                                    {/* GROUP: Detail Konsumsi */}
                                    <div className="space-y-5 p-6 border rounded-xl bg-blue-50/70 shadow-inner border-blue-200">
                                        <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                                            <h3 className="text-xl font-bold text-blue-800 flex items-center"><Utensils className="h-5 w-5 mr-2 text-blue-600"/> Detail Konsumsi</h3>
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm font-medium text-gray-700">Total Qty: <span className="text-blue-600 font-bold text-lg">{totalQty}</span></span>
                                                <Button type="button" size="sm" onClick={() => append({ id: "", jenis: "", satuan: "", qty: "1" })} className="transition-all duration-200 bg-green-500 hover:bg-green-600 shadow-green-500/30"><Plus className="h-4 w-4 mr-1.5"/>Tambah Item</Button>
                                            </div>
                                        </div>
                                        {form.formState.errors.konsumsi && !Array.isArray(form.formState.errors.konsumsi) && ( <p className="text-sm font-medium text-red-500 pt-1">{form.formState.errors.konsumsi.message}</p> )}
                                        <div className="space-y-4 pt-2">
                                            {fields.map((field, index) => (
                                                <div key={field.id} className="relative flex flex-col sm:flex-row items-center gap-4 p-4 pr-12 bg-white rounded-lg border border-gray-200 shadow-md transition-shadow hover:shadow-lg">
                                                    <Button type="button" variant="ghost" size="sm" onClick={() => remove(index)} className="absolute top-1/2 right-3 transform -translate-y-1/2 text-red-500 hover:bg-red-100 hover:text-red-600 p-0 h-8 w-8 rounded-full z-10" disabled={fields.length <= 1}> <Trash2 className="h-5 w-5"/> </Button>
                                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 w-full sm:w-auto">
                                                        <div className="w-full space-y-1">
                                                            {index === 0 && <Label htmlFor={`konsumsi.${index}.id`} className="text-xs font-medium text-gray-600 flex items-center"><Utensils className='w-3 h-3 mr-1 opacity-60'/>Jenis Konsumsi</Label>}
                                                            {/* PERUBAHAN: Hanya set jenis, tidak set satuan */}
                                                            <Controller control={form.control} name={`konsumsi.${index}.id`} render={({ field: { onChange, value } }) => ( <SearchableSelect placeholder="(Wajib) Pilih Jenis" options={dynamicJenisKonsumsiOptions} value={value} onChange={(selectedId) => { const selectedOption = dynamicJenisKonsumsiOptions.find(opt => opt.value === selectedId); onChange(selectedId); form.setValue(`konsumsi.${index}.jenis`, selectedOption ? selectedOption.label : '', { shouldValidate: true }); /* Hapus setValue satuan */ }} error={!!form.formState.errors.konsumsi?.[index]?.id} /> )}/>
                                                            {form.formState.errors.konsumsi?.[index]?.id && ( <p className="text-xs text-red-500 mt-1">{form.formState.errors.konsumsi?.[index]?.id?.message}</p> )}
                                                        </div>
                                                        {/* PERUBAHAN: Input Satuan menjadi SearchableSelect */}
                                                        <div className="w-full space-y-1">
                                                            {index === 0 && <Label htmlFor={`konsumsi.${index}.satuan`} className="text-xs font-medium text-gray-600 flex items-center"><BoxIcon className='w-3 h-3 mr-1 opacity-60'/>Satuan</Label>}
                                                            <Controller control={form.control} name={`konsumsi.${index}.satuan`} render={({ field }) => ( <SearchableSelect placeholder="Pilih Satuan" options={SATUAN_OPTIONS} value={field.value} onChange={field.onChange} error={!!form.formState.errors.konsumsi?.[index]?.satuan} /> )}/>
                                                            {form.formState.errors.konsumsi?.[index]?.satuan && ( <p className="text-xs text-red-500 mt-1">{form.formState.errors.konsumsi?.[index]?.satuan?.message}</p> )}
                                                        </div>
                                                        <div className="w-full space-y-1">
                                                            {/* PERUBAHAN: Label Kuantitas -> Qty */}
                                                           {index === 0 && <Label htmlFor={`konsumsi.${index}.qty`} className="text-xs font-medium text-gray-600 flex items-center"><HashIcon className='w-3 h-3 mr-1 opacity-60'/>Qty</Label>}
                                                            <Controller control={form.control} name={`konsumsi.${index}.qty`} render={({ field }) => ( <QtyStepper value={field.value} onChange={field.onChange} error={!!form.formState.errors.konsumsi?.[index]?.qty} /> )}/>
                                                            {form.formState.errors.konsumsi?.[index]?.qty && ( <p className="text-xs text-red-500 mt-1">{form.formState.errors.konsumsi?.[index]?.qty?.message}</p> )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {/* PERUBAHAN: Label Catatan */}
                                        <div className="space-y-2 pt-4 border-t border-blue-200/60 mt-4">
                                            <Label htmlFor="catatan">Catatan Tambahan</Label>
                                            <Input id="catatan" {...form.register("catatan")} placeholder="Contoh: 5 porsi vegetarian, 2 tidak pedas" error={!!form.formState.errors.catatan} />
                                            {form.formState.errors.catatan && ( <p className="text-sm font-medium text-red-500 mt-1">{form.formState.errors.catatan.message}</p> )}
                                        </div>
                                    </div>
                                </form>
                            </CardContent>
                            <CardFooter className="flex justify-between border-t pt-6 mt-6">
                                {/* PERUBAHAN: Teks Tombol Batal */}
                                <Button variant="outline" onClick={onReturnToDashboard}>Kembali</Button>
                                <Button variant="primary" onClick={handleNextStep}>Lanjut ke Review</Button>
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
                                        <ReviewItem label={labels.tamu} value={tamuOptions.find(opt => opt.value === values.tamu)?.label} icon={<Users className="w-5 h-5" />} />
                                        <ReviewItem label={labels.lokasi} value={values.lokasi} icon={<MapPin className="w-5 h-5" />} />
                                        <ReviewItem label={labels.tanggalPengiriman} value={values.tanggalPengiriman} icon={<CalendarDays className="w-5 h-5" />} />
                                        <ReviewItem label={labels.waktu} value={values.waktu} icon={<Clock className="w-5 h-5" />} />
                                        <ReviewItem label={labels.jamPengiriman} value={values.jamPengiriman || '-'} icon={<Clock className="w-5 h-5" />} />
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
                                            const displaySatuan = item.satuan || 'unit'; // Tampilkan satuan yang dipilih user
                                            return (
                                                <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <img src={masterItem?.img || 'https://placehold.co/100x100/CCCCCC/FFFFFF?text=N/A'} alt={displayName} className="h-14 w-14 rounded-md object-cover border bg-gray-200" onError={(e) => (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/CCCCCC/FFFFFF?text=Err'} />
                                                    <div className="flex-1">
                                                        <span className="font-semibold text-gray-800 text-base">{displayName}</span>
                                                        <span className="block text-xs text-gray-500">{masterItem ? `Level Tamu Min: ${Object.keys(TINGKAT_TAMU).find(k => TINGKAT_TAMU[k] === masterItem.tamuMinLevel) || 'N/A'}` : ''}</span>
                                                    </div>
                                                    <span className="text-xl font-bold text-blue-600 px-2 flex-shrink-0">{item.qty} <span className="text-sm font-medium text-gray-500">{displaySatuan}</span></span>
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

export default PemesananForm;

