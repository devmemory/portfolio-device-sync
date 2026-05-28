import { Children, JSX, ReactNode } from "react";

export const getSubComponent = (children: ReactNode, name: any) => {
  return Children.map(children, (child) => {
    return (child as JSX.Element)?.type?.displayName === name ? child : null;
  });
};
