import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { AppState } from "@excalidraw/excalidraw/types/types";
import { Subscription } from "react-states";

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

export type Chapter = {
  content: string;
  toc: Toc[];
};

export type Sandbox = {
  [path: string]: string;
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

export type ProjectSubscription =
  | {
      type: "PROJECT:LOAD_SUCCESS";
      chapters: Chapter[];
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
      type: "PROJECT:CHAPTERS_UPDATE";
      chapters: Chapter[];
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
      type: "PROJECT:LOAD_SANDBOX_SUCCESS";
      path: string;
      sandbox: Sandbox;
    }
  | {
      type: "PROJECT:LOAD_SANDBOX_ERROR";
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
      changes: GitChange[];
    }
  | {
      type: "PROJECT:SAVE_ERROR";
      error: string;
    }
  | {
      type: "PROJECT:VERSION_CHECK_SUCCESS";
      commitSha: string | null;
    };

export type Project = {
  subscription: Subscription<ProjectSubscription>;
  load(repoUrl: string, branch: string): void;
  checkVersion(repoUrl: string, branch: string): void;
  getLatestVersion(repoUrl: string, branch: string): void;
  updateChapter(repoUrl: string, chapterIndex: number, content: string): void;
  updateExcalidraw(repoUrl: string, id: string, excalidraw: Excalidraw): void;
  addChapter(repoUrl: string, index: number): void;
  loadSnippet(repoUrl: string, path: string): void;
  loadSandbox(repoUrl: string, path: string): void;
  save(repoUrl: string, accessToken: string): void;
};
