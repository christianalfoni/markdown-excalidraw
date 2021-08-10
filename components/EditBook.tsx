import React, { useEffect, useRef, useState } from "react";
import type { ExcalidrawAPIRefValue } from "@excalidraw/excalidraw/types/types";
import type ExcalidrawComponent from "@excalidraw/excalidraw";
import { useProject } from "../features/project";
import { match } from "react-states";
import { Book } from "./Book";
import { EditPage } from "./EditPage";

export const EditBook = () => {
  const [project, send] = useProject();
  const { pages, pageIndex, excalidraws } = project;
  const currentPage = pages[pageIndex];

  const [Comp, setComp] = useState<typeof ExcalidrawComponent | null>(null);
  const excalidrawRef = useRef<ExcalidrawAPIRefValue>(null);

  useEffect(() => {
    import("@excalidraw/excalidraw").then((comp) => setComp(comp.default));
  }, []);

  return match(project.mode, {
    DRAWING: ({ id }) => (
      <div className="h-screen">
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
        caretPosition={project.caretPosition}
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
    READING: () => <Book />,
  });
};
