import { DocumentIcon } from "@heroicons/react/outline";
import Link from "next/link";
import React from "react";
import { Chapter } from "../features/writeBook";
import { classNames } from "../utils";

export const TocList = React.memo(
  ({
    chapters,
    chapterIndex,
    onAddChapter,
  }: {
    chapters: Chapter[];
    chapterIndex: number;
    onAddChapter?: () => void;
  }) => (
    <>
      {chapters.map((chapter, index) => {
        const isCurrent = index === chapterIndex;
        const header = chapter.toc.find((el) => el.level === 1);

        return (
          <React.Fragment key={index}>
            <Link href={`/?page=${index}`}>
              <a
                className={classNames(
                  isCurrent
                    ? "text-gray-200"
                    : "text-gray-400 hover:text-gray-300",
                  "group flex items-center px-2 py-2 text-base font-medium rounded-r-md"
                )}
                aria-current={isCurrent ? "page" : undefined}
              >
                <DocumentIcon
                  className="mr-2 flex-shrink-0 h-6 w-6"
                  aria-hidden="true"
                />
                {header ? header.name : `Page ${index + 1}`}
              </a>
            </Link>
            {onAddChapter && isCurrent ? (
              <button
                onClick={onAddChapter}
                className="text-gray-300 hover:text-gray-300 group flex items-center px-2 py-2 text-sm justify-center font-medium rounded-md bg-gray-800 w-full"
              >
                Add page
              </button>
            ) : null}
          </React.Fragment>
        );
      })}
    </>
  )
);
