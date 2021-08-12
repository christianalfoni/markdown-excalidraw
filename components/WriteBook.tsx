import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ExcalidrawAPIRefValue } from "@excalidraw/excalidraw/types/types";
import type ExcalidrawComponent from "@excalidraw/excalidraw";
import {
  Excalidraw,
  useWriteBook,
  WriteBookContext,
} from "../features/writeBook";
import { match, PickContext } from "react-states";
import { Pages } from "./Pages";
import { EditPage } from "./EditPage";
import { Loading } from "./Loading";
import { ExcalidrawsProvider } from "./ExcalidrawsProvider";
import { TocList } from "./TocList";

import { GitChanges } from "./GitChanges";
import { DatabaseIcon, MenuAlt2Icon } from "@heroicons/react/outline";
import { classNames } from "../utils";

export const WriteBook = () => {
  const [book, send] = useWriteBook();
  const { menu, pages, pageIndex, excalidraws } = book;
  const currentPage = pages[pageIndex];

  const [Comp, setComp] = useState<typeof ExcalidrawComponent | null>(null);
  const excalidrawRef = useRef<ExcalidrawAPIRefValue>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => setComp(comp.default));
  }, []);

  const onAddPage = useCallback(() => {
    send({ type: "ADD_PAGE" });
  }, []);

  const renderBook = (
    readyContext: PickContext<WriteBookContext, "READY" | "SAVING">
  ) => (
    <ExcalidrawsProvider excalidraws={readyContext.excalidraws}>
      <div
        className={classNames(
          "p-4 absolute top-0 h-screen transition-all ease-in-out",
          match(menu, {
            TOC: () => "left-0 duration-500",
            IDLE: () => "-left-72 duration-300",
            GIT: () => "-left-72 duration-300",
          })
        )}
      >
        <TocList pages={pages} pageIndex={pageIndex} onAddPage={onAddPage} />
      </div>
      <div
        className={classNames(
          "absolute top-0 min-h-screen w-screen flex font-serif font-normal text-gray-600 mx-auto transition-all ease-in-out duration-300",
          match(menu, {
            TOC: () => "left-72",
            IDLE: () => "left-0",
            GIT: () => "-left-72",
          })
        )}
      >
        <MenuAlt2Icon
          onClick={() => {
            send({
              type: "TOGGLE_TOC",
            });
          }}
          className="w-6 h-6 text-gray-100 0 absolute top-4 left-4"
        />
        <DatabaseIcon
          onClick={() => {
            send({ type: "TOGGLE_GIT" });
          }}
          className="w-6 h-6 text-gray-100 absolute top-4 right-4"
        />
        {readyContext.changes.length ? (
          <span className="bg-red-500 w-3 h-3 top-3 right-4 rounded-full absolute border-2 border-gray-900" />
        ) : null}
        <div className="mx-auto flex items-center">
          {match(book.mode, {
            DRAWING: ({ id }) => (
              <div className="h-screen w-screen">
                {Comp ? (
                  <Comp
                    ref={excalidrawRef}
                    initialData={excalidraws[id] ? excalidraws[id] : undefined}
                    onChange={(elements, appState) => {
                      if (
                        excalidraws[id] &&
                        excalidraws[id].elements === elements &&
                        excalidraws[id].appState === appState
                      ) {
                        return;
                      }

                      send({
                        type: "UPDATE_EXCALIDRAW",
                        id,
                        excalidraw: {
                          elements,
                          appState,
                        },
                      });
                    }}
                  />
                ) : null}
              </div>
            ),
            EDITING: () => (
              <EditPage
                key={pageIndex}
                initialContent={currentPage.content}
                caretPosition={book.caretPosition}
                updateCaretPosition={(position) => {
                  send({
                    type: "CHANGE_CARET_POSITION",
                    position,
                  });
                }}
                onChange={(content) => {
                  send({
                    type: "UPDATE_PAGE",
                    content,
                  });
                }}
              />
            ),
            READING: () => <Pages pages={pages} />,
          })}
        </div>
      </div>
      <GitChanges book={readyContext} send={send} />
    </ExcalidrawsProvider>
  );

  return match(book, {
    LOADING_PROJECT: () => <Loading />,
    READY: renderBook,
    SAVING: renderBook,
  });
};
