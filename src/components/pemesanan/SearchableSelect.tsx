"use client";

import React, { useState, useEffect, useRef } from "react";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: (string | Option)[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Pilih opsi...",
}) => {
  const [search, setSearch] = useState("");
  const [filteredOptions, setFilteredOptions] = useState<(string | Option)[]>(options);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter opsi berdasarkan input pencarian
  useEffect(() => {
    const normalized = options || [];
    const lowerSearch = (search || "").toLowerCase();

    const filtered = normalized.filter((opt) => {
      const label = typeof opt === "string" ? opt : opt.label;
      return label.toLowerCase().includes(lowerSearch);
    });

    setFilteredOptions(filtered);
  }, [options, search]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Saat opsi diklik
  const handleOptionClick = (val: string) => {
    onChange(val);
    setSearch("");
    setIsOpen(false);
  };

  // Ambil label dari value saat ini
  const selectedLabel = (() => {
    const found = options.find((opt) =>
      typeof opt === "string" ? opt === value : opt.value === value
    );
    return typeof found === "string" ? found : found?.label || "";
  })();

  return (
    <div className="relative w-full" ref={containerRef}>
      <input
        type="text"
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
        value={isOpen ? search : selectedLabel}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => setSearch(e.target.value)}
        readOnly={!isOpen}
      />

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-auto rounded-md border border-gray-200 bg-white shadow-md">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => {
              const label = typeof option === "string" ? option : option.label;
              const val = typeof option === "string" ? option : option.value;
              return (
                <div
                  key={index}
                  onClick={() => handleOptionClick(val)}
                  className={`cursor-pointer px-4 py-2 text-sm hover:bg-gray-100 ${
                    value === val ? "bg-gray-100 font-medium" : ""
                  }`}
                >
                  {label}
                </div>
              );
            })
          ) : (
            <div className="px-4 py-2 text-sm text-gray-500">Tidak ada hasil</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
