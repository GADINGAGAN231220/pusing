import React from 'react';
import { cn } from '../../lib/utils'; // Pastikan path ini benar

// Tidak perlu interface InputProps jika tidak menambah properti baru
// export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>( // Langsung gunakan tipe bawaan
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300", // Tambahkan style dark mode jika perlu
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"; // Pindahkan displayName setelah deklarasi

export { Input }; // Hanya ekspor komponen Input