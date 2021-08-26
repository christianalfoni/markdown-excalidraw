import { StateTransition } from "react-states";
import { Excalidraw, GitChange, Chapter } from "../../environments/project";
import { Position } from "../../components/Editor";

export type { Excalidraw, Chapter };

export type ModeState =
  | {
      state: "EDITING";
    }
  | {
      state: "READING";
    }
  | {
      state: "DRAWING";
      id: string;
    };

export type MenuState =
  | {
      state: "IDLE";
    }
  | {
      state: "TOC";
    }
  | {
      state: "GIT";
    };

export type VersionState =
  | {
      state: "UP_TO_DATE";
    }
  | {
      state: "BEHIND";
    };

export type CaretPosition = Position;

type BaseState = {
  chapterIndex: number;
  chapters: Chapter[];
  excalidraws: {
    [id: string]: Excalidraw;
  };
  mode: ModeState;
  menu: MenuState;
  caretPosition: CaretPosition;
  version: VersionState;
};

export type State = BaseState &
  (
    | {
        state: "LOADING_PROJECT";
      }
    | {
        state: "READY";
        commitSha: string;
        changes: GitChange[];
      }
    | {
        state: "SAVING";
        commitSha: string;
        changes: GitChange[];
      }
    | {
        state: "UPDATING";
        commitSha: string;
        changes: GitChange[];
      }
  );

export type Command =
  | {
      cmd: "UPDATE_PAGE";
      chapterIndex: number;
      content: string;
    }
  | {
      cmd: "INSERT_EXCALIDRAW";
      content: string;
      id: string;
      chapterIndex: number;
    }
  | {
      cmd: "UPDATE_EXCALIDRAW";
      id: string;
      excalidraw: Excalidraw;
    }
  | {
      cmd: "ADD_CHAPTER";
      chapterIndex: number;
    };

export type Action =
  | {
      type: "UPDATE_PAGE";
      content: string;
    }
  | {
      type: "CHANGE_MODE";
      mode: ModeState;
    }
  | {
      type: "CHANGE_CARET_POSITION";
      position: CaretPosition;
    }
  | {
      type: "UPDATE_EXCALIDRAW";
      id: string;
      excalidraw: Excalidraw;
    }
  | {
      type: "TOGGLE_TOC";
    }
  | {
      type: "TOGGLE_GIT";
    }
  | {
      type: "ADD_CHAPTER";
    }
  | {
      type: "SAVE";
    }
  | {
      type: "UPDATE";
    };

export type PrivateAction =
  | {
      type: "INSERT_EXCALIDRAW";
    }
  | {
      type: "CHANGE_CHAPTER";
      index: number;
    };

export type Transition = StateTransition<State, Command>;
