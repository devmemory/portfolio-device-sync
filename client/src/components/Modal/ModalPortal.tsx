import { ReactNode } from "react";
import { createPortal } from "react-dom";

export const ModalPortal = ({ children }: { children: ReactNode }) => {
  const modal = document.getElementById("modal");

  if (modal === null) {
    return null;
  }

  return createPortal(children, modal);
};
