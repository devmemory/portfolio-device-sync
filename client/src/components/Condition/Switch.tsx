import React, { ReactNode } from "react";

type SwitchProps<T extends string | number | symbol> = {
  when: T;
} & {
  [K in T]: ReactNode;
};

export const Switch = <T extends string | number | symbol>(
  props: SwitchProps<T>,
) => {
  const { when, ...cases } = props;
  const typedCases = cases as unknown as Record<T, ReactNode>;
  return <>{typedCases[when]}</>;
};
