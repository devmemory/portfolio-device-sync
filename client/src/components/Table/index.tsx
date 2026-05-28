import React, { ReactNode, TdHTMLAttributes } from "react";

interface Props {
  className?: string;
  children: ReactNode;
}

export const Table = ({ children }: Props) => {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="md:overflow-x-auto">
        <table className="block w-full border-collapse md:table md:min-w-[680px]">
          {children}
        </table>
      </div>
    </div>
  );
};

Table.Head = ({ list }: { list: string[] }) => {
  return (
    <thead className="hidden bg-slate-50 text-ink-600 md:table-header-group">
      <tr>
        {list.map((item) => (
          <th
            key={item}
            className="px-5 py-3 text-left text-xs font-semibold uppercase"
          >
            {item}
          </th>
        ))}
      </tr>
    </thead>
  );
};

Table.Body = ({ children }: Props) => {
  return (
    <tbody className="grid gap-3 bg-slate-50 p-3 md:table-row-group md:divide-y md:divide-slate-100 md:bg-white md:p-0">
      {children}
    </tbody>
  );
};

Table.Row = ({
  onClick,
  children,
}: Props & {
  onClick?: VoidFunction;
}) => {
  return (
    <tr
      className="grid gap-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-colors duration-150 hover:bg-primary-50/50 md:table-row md:border-0 md:p-0 md:shadow-none"
      onClick={onClick}
    >
      {children}
    </tr>
  );
};

Table.Td = ({
  children,
  className,
  label,
  ...props
}: Props &
  TdHTMLAttributes<HTMLTableCellElement> & {
    label?: string;
  }) => {
  return (
    <td
      data-label={label}
      className={`grid grid-cols-[minmax(5rem,8rem)_1fr] items-start gap-3 px-0 py-1 text-left text-sm text-ink-900 before:text-xs before:font-semibold before:uppercase before:text-ink-600 before:content-[attr(data-label)] md:table-cell md:px-5 md:py-4 md:before:hidden ${!label ? "block before:hidden md:table-cell" : ""} ${className ?? ""}`}
      {...props}
    >
      {children}
    </td>
  );
};
