import React, { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const variantClass = {
  primary:
    "bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700 active:bg-primary-700",
  secondary:
    "border border-slate-200 bg-white text-ink-900 shadow-sm hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-ink-600 hover:bg-slate-100 active:bg-slate-200",
  danger:
    "bg-rose-50 text-rose-700 hover:bg-rose-100 active:bg-rose-200 border border-rose-100",
};

export const Button = ({
  className,
  variant = "primary",
  type = "button",
  ...props
}: Props) => {
  return (
    <button
      type={type}
      className={`box-border flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-500/30 ${variantClass[variant]} ${className ?? ""}`}
      {...props}
    />
  );
};
