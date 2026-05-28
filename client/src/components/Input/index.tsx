import React, { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const Input = ({ className, label, helperText, id, ...props }: Props) => {
  const inputId = id ?? props.name;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink-900">
      {label && <span>{label}</span>}
      <input
        id={inputId}
        className={`h-11 rounded-md border border-slate-200 bg-white px-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 ${className ?? ""}`}
        {...props}
      />
      {helperText && <span className="text-xs font-normal text-ink-600">{helperText}</span>}
    </label>
  );
};
