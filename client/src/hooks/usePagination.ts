import { useState } from "react";
import { PageModel } from "src/models";

export const usePagination = () => {
  const [pageModel, setPageModel] = useState<PageModel & { lastPage: number }>({
    page: 1,
    limit: 10,
    lastPage: 1,
  });

  const onChangePage = (page: number) => {
    setPageModel((state) => {
      return { ...state, page };
    });
  };

  const onSetTotal = (value: number) => {
    setPageModel((state) => {
      return { ...state, lastPage: Math.ceil(value / state.limit) };
    });
  };

  return { pageModel, onChangePage, onSetTotal };
};
