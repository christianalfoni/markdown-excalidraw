import { useEffect, useState } from "react";

export const usePageState = (initialPage: number = 0) => {
  const [pageState, setPageState] = useState({
    index: initialPage,
    firstPageIndex: initialPage % 2 === 0 ? initialPage : initialPage + 1,
    flip: 0,
  });

  function prev() {
    setPageState((current) => {
      const index = current.index - 2;
      const firstPageIndex = index;

      return {
        ...current,
        index,
        firstPageIndex,
        flip: 3,
      };
    });
  }

  function next() {
    setPageState((current) => {
      const index = current.index + 2;

      return {
        ...current,
        index,
        flip: 1,
      };
    });
  }

  useEffect(() => {
    if (pageState.flip === 1) {
      const firstPageIndex = pageState.index;

      const timeout = setTimeout(() => {
        setPageState((current) => {
          return {
            ...current,
            firstPageIndex,
            flip: 2,
          };
        });
      }, 500);

      return () => {
        clearTimeout(timeout);
      };
    }
    if (pageState.flip >= 2) {
      requestAnimationFrame(() => {
        setPageState((current) => ({
          ...current,
          flip: 0,
        }));
      });
    }
  }, [pageState.flip]);

  return {
    index: pageState.firstPageIndex,
    flip: pageState.flip,
    next,
    prev,
  };
};
