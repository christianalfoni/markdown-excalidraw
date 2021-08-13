import { StateTransition } from "react-states";
import { Excalidraw, GitChange, Page } from "../../environments/project";

export type { Excalidraw, Page };

export type ModeState =
  | {
      context: "EDITING";
    }
  | {
      context: "READING";
    }
  | {
      context: "DRAWING";
      id: string;
    };

export type MenuState =
  | {
      context: "IDLE";
    }
  | {
      context: "TOC";
    }
  | {
      context: "GIT";
    };

export type CaretPosition = {
  line: number;
  char: number;
};

type BaseState = {
  pageIndex: number;
  pages: Page[];
  excalidraws: {
    [id: string]: Excalidraw;
  };
  mode: ModeState;
  menu: MenuState;
  caretPosition: CaretPosition;
};

export type State = BaseState &
  (
    | {
        context: "LOADING_PROJECT";
      }
    | {
        context: "READY";
        commitSha: string;
        changes: GitChange[];
      }
    | {
        context: "SAVING";
        commitSha: string;
        changes: GitChange[];
      }
  );

export type Command =
  | {
      cmd: "UPDATE_PAGE";
      pageIndex: number;
      content: string;
    }
  | {
      cmd: "INSERT_EXCALIDRAW";
      content: string;
      id: string;
      pageIndex: number;
    }
  | {
      cmd: "UPDATE_EXCALIDRAW";
      id: string;
      excalidraw: Excalidraw;
    }
  | {
      cmd: "ADD_PAGE";
      pageIndex: number;
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
      type: "ADD_PAGE";
    }
  | {
      type: "SAVE";
    };

export type PrivateAction =
  | {
      type: "INSERT_EXCALIDRAW";
    }
  | {
      type: "CHANGE_PAGE";
      index: number;
    };

export type Transition = StateTransition<State, Command>;
