import React, { ReactNode } from "react";
import { Button } from "src/components/Button";
import { ModalPortal } from "./ModalPortal";

interface Props {
  children: ReactNode;
  isOpen: boolean;
  title: string;
  description?: string;
  onClose: VoidFunction;
}

export const Modal = ({
  children,
  isOpen,
  title,
  description,
  onClose,
}: Props) => {
  if (!isOpen) {
    return null;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-950/20">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-ink-900">{title}</h2>
              {description && (
                <p className="mt-1 text-sm text-ink-600">{description}</p>
              )}
            </div>
            <Button
              aria-label="Close modal"
              className="h-9 min-h-9 w-9 px-0"
              onClick={onClose}
              variant="ghost"
            >
              x
            </Button>
          </div>
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
};
