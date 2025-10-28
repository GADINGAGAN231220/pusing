import React, { createContext, useContext, useState, ReactNode } from 'react';
import { cn } from '../../lib/utils'; // Pastikan path ini benar

const ChevronDown: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 9 6 6 6-6"/></svg>;

// Gunakan generic T untuk tipe value, default ke string | number
interface SelectContextType<T = string | number> {
    open: boolean;
    setOpen: (open: boolean) => void;
    value: T | null | undefined; // Izinkan null atau undefined
    onValueChange: (value: T) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SelectContext = createContext<SelectContextType<any> | undefined>(undefined);

// Props untuk Select dengan generic
interface SelectProps<T = string | number> {
    value: T | null | undefined;
    onValueChange: (value: T) => void;
    children: ReactNode;
}

const Select = <T = string | number>({ value, onValueChange, children }: SelectProps<T>) => {
    const [open, setOpen] = useState(false);
    // Pastikan context value sesuai dengan SelectContextType<T>
    const contextValue: SelectContextType<T> = { open, setOpen, value, onValueChange };
    return (
        <SelectContext.Provider value={contextValue}>
            <div className="relative">{children}</div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(({ className, children, ...props }, ref) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectTrigger must be used within a Select");
    const { open, setOpen } = context;
    return (
        <button ref={ref} onClick={() => setOpen(!open)} className={cn("flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus:ring-slate-300", className)} {...props}>
            {children} <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    );
});
SelectTrigger.displayName = "SelectTrigger";

// Props untuk SelectValue
interface SelectValueProps {
    placeholder?: string;
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectValue must be used within a Select");
    // Di sini value bisa jadi T | null | undefined
    const { value } = context;
    // Tampilkan value jika ada, jika tidak, tampilkan placeholder
    // Perlu cara untuk mendapatkan representasi string dari value jika bukan string/number
    // Untuk sederhana, kita asumsikan value punya representasi string atau kita cari labelnya
    // Atau kita bisa terima children di SelectValue untuk menampilkan label secara eksplisit
    return <span>{value !== null && value !== undefined ? String(value) : placeholder}</span>; // Contoh sederhana, mungkin perlu disesuaikan
};
SelectValue.displayName = "SelectValue";


const SelectContent = ({ children, className }: { children: ReactNode, className?: string }) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectContent must be used within a Select");
    const { open } = context;
    if (!open) return null;
    return <div className={cn("absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border bg-white text-slate-950 shadow-md dark:border-slate-800 dark:bg-slate-950 dark:text-slate-50", className)}>{children}</div>;
};
SelectContent.displayName = "SelectContent";

// Props untuk SelectItem dengan generic
interface SelectItemProps<T = string | number> {
    value: T;
    children: ReactNode;
    className?: string;
}

const SelectItem = <T = string | number>({ value, children, className }: SelectItemProps<T>) => {
    const context = useContext(SelectContext);
    if (!context) throw new Error("SelectItem must be used within a Select");
    const { setOpen, onValueChange } = context;
    return (
        <div onClick={() => { onValueChange(value); setOpen(false); }} className={cn("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-slate-100 data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-slate-100 dark:focus:bg-slate-800 dark:hover:bg-slate-800", className)}>
            {children}
        </div>
    );
};
SelectItem.displayName = "SelectItem";


export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };