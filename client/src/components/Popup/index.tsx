import React, { useState, useEffect } from "react";
import { popupEventBus } from "src/utils/popupUtil";
import { PopupPortal } from "./PopupPortal";

export const Popup = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    const unsubscribe = popupEventBus.subscribe((msg) => {
      setMessage(msg);
      setIsOpen(true);

      let timeout = setTimeout(() => {
        setIsOpen(false);
        setMessage("");
        clearTimeout(timeout);
      }, 3000);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <PopupPortal>
      <div
        className="fixed left-1/2 top-6 z-[9999] min-w-[240px] -translate-x-1/2 rounded-lg
        border border-slate-200 bg-white px-4 py-3 text-sm shadow-xl shadow-slate-900/10"
      >
        <div className="text-center font-semibold text-ink-900">{message}</div>
      </div>
    </PopupPortal>
  );
};
