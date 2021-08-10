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

export type GitStatus =
  | "ADD_UNSTAGED"
  | "ADD_STAGED"
  | "ADD_PARTIALLY_STAGED"
  | "UNMODIFIED"
  | "MODIFIED_UNSTAGED"
  | "MODIFIED_STAGED"
  | "MODIFIED_PARTIALLY_STAGED"
  | "DELETED_UNSTAGED"
  | "DELETED_STAGED";

export type GitChange = {
  path: string;
  status: GitStatus;
};

export type ProjectEvent =
  | {
      type: "PROJECT:LOAD_SUCCESS";
      pages: Page[];
      excalidraws: {
        [id: string]: Excalidraw;
      };
      commitSha: string;
      changes: GitChange[];
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
    }
  | {
      type: "PROJECT:GIT_UPDATE";
      changes: GitChange[];
    }
  | {
      type: "PROJECT:SAVE_SUCCESS";
      commitSha: string;
    }
  | {
      type: "PROJECT:SAVE_ERROR";
      error: string;
    };

export type Project = {
  events: Events<ProjectEvent>;
  load: (repoUrl: string) => void;
  updatePage(repoUrl: string, pageIndex: number, content: string): void;
  updateExcalidraw(repoUrl: string, id: string, excalidraw: Excalidraw): void;
  addPage(repoUrl: string, index: number): void;
  loadSnippet(repoUrl: string, path: string): void;
  save(repoUrl: string, accessToken: string): void;
};
