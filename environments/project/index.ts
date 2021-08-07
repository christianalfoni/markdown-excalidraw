import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { AppState } from "@excalidraw/excalidraw/types/types";
import { Events } from "react-states";

export type Excalidraw = {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
};

export type Toc = {
  id: string;
  level: number;
  name: string;
  descendants: Toc[];
};

export type Page = {
  content: string;
  toc: Toc[];
};

export type ProjectEvent =
  | {
      type: "PROJECT:LOAD_SUCCESS";
      pages: Page[];
      excalidraws: {
        [id: string]: Excalidraw;
      };
    }
  | {
      type: "PROJECT:LOAD_ERROR";
      error: string;
    }
  | {
      type: "PROJECT:PAGES_UPDATE";
      pages: Page[];
    }
  | {
      type: "PROJECT:LOAD_SNIPPET_SUCCESS";
      path: string;
      code: string;
    }
  | {
      type: "PROJECT:LOAD_SNIPPET_ERROR";
      path: string;
      error: string;
    };

export type Project = {
  events: Events<ProjectEvent>;
  load: (repoUrl: string) => void;
  updatePage(repoUrl: string, pageIndex: number, content: string): void;
  updateExcalidraw(repoUrl: string, id: string, excalidraw: Excalidraw): void;
  addPage(repoUrl: string, index: number): void;
  loadSnippet(repoUrl: string, path: string): void;
};
