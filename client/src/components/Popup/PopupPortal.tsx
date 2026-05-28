import { ReactNode } from "react";
import { createPortal } from "react-dom";

export const PopupPortal = ({ children }: { children: ReactNode }) => {
  const modal = document.getElementById("popup");

  if (modal === null) {
    return null;
  }

  return createPortal(children, modal);
};
