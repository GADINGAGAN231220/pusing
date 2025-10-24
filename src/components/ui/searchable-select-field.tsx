"use client";

import * as React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectFieldProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  placeholder?: string;
  options: Option[];
}

export function SearchableSelectField<T extends FieldValues>({
  name,
  control,
  label,
  placeholder,
  options,
}: SearchableSelectFieldProps<T>) {
  return (
    <FormItem>
      {label && <FormLabel>{label}</FormLabel>}
      <FormControl>
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <SearchableSelect
              placeholder={placeholder}
              options={options}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
