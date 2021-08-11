import React, { useEffect, useRef, useState } from "react";
import type { ExcalidrawAPIRefValue } from "@excalidraw/excalidraw/types/types";
import type ExcalidrawComponent from "@excalidraw/excalidraw";
import { useWriteBook } from "../features/writeBook";
import { match } from "react-states";
import { Pages } from "./Pages";
import { EditPage } from "./EditPage";
import { Loading } from "./Loading";
import { ExcalidrawsProvider } from "./ExcalidrawsProvider";
import { Toc } from "./Toc";
import { AppContent } from "./AppContent";

import { GitChanges } from "./GitChanges";
import { DatabaseIcon, MenuAlt2Icon } from "@heroicons/react/outline";

export const WriteBook = () => {
  const [book, send] = useWriteBook();
  const { pages, pageIndex, excalidraws } = book;
  const currentPage = pages[pageIndex];

  const [Comp, setComp] = useState<typeof ExcalidrawComponent | null>(null);
  const excalidrawRef = useRef<ExcalidrawAPIRefValue>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => setComp(comp.default));
  }, []);

  return match(book, {
    LOADING_PROJECT: () => <Loading />,
    READY: (readyContext) => (
      <ExcalidrawsProvider excalidraws={readyContext.excalidraws}>
        <Toc />
        <AppContent>
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
                <div className="h-screen">
                  {Comp ? (
                    <Comp
                      ref={excalidrawRef}
                      initialData={
                        excalidraws[id] ? excalidraws[id] : undefined
                      }
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
        </AppContent>
        <GitChanges book={readyContext} />
      </ExcalidrawsProvider>
    ),
  });
};
