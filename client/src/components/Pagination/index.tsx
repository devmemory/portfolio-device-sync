import React, { useMemo } from "react";

interface Props {
  currentPage: number;
  limit?: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  limit = 10,
  lastPage,
  onPageChange,
}: Props) => {
  let pageRange = Math.ceil(currentPage / limit);

  const lastPageRange = Math.ceil(lastPage / limit);

  const getPageList = useMemo(() => {
    const start = (pageRange - 1) * limit + 1;

    const end = limit * pageRange > lastPage ? lastPage : limit * pageRange;

    return Array(end - start + 1)
      .fill(null)
      .map((_, index) => index + start);
  }, [pageRange, limit, lastPage]);

  const changePageRange = (isAdd: boolean) => {
    pageRange = isAdd ? pageRange + 1 : pageRange - 1;

    const page = isAdd ? (pageRange - 1) * limit + 1 : pageRange * limit;

    onPageChange(page);
  };

  if (lastPage <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {pageRange > 1 && (
        <button
          className="h-9 min-w-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-ink-600 shadow-sm hover:bg-slate-50"
          onClick={() => changePageRange(false)}
        >
          Prev
        </button>
      )}

      {getPageList.map((value) => (
        <button
          key={`p-${value}`}
          className={`h-9 min-w-9 rounded-md px-3 text-sm font-semibold transition ${
            currentPage === value
              ? "bg-primary-600 text-white shadow-sm"
              : "border border-slate-200 bg-white text-ink-600 hover:bg-slate-50"
          }`}
          onClick={() => onPageChange(value)}
          data-selected={currentPage === value}
        >
          {value}
        </button>
      ))}

      {pageRange < lastPageRange && (
        <button
          className="h-9 min-w-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-ink-600 shadow-sm hover:bg-slate-50"
          onClick={() => changePageRange(true)}
        >
          Next
        </button>
      )}
    </div>
  );
};
