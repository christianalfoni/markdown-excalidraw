import { Context, ContextTransition } from "react-states";
import { Excalidraw, GitChange, Page } from "../../environments/project";

export type { Excalidraw, Page };

export type ModeContext =
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

export type MenuContext =
  | {
      state: "IDLE";
    }
  | {
      state: "TOC";
    }
  | {
      state: "GIT";
    };

export type CaretPosition = {
  line: number;
  char: number;
};

type BaseContext = {
  pageIndex: number;
  pages: Page[];
  excalidraws: {
    [id: string]: Excalidraw;
  };
  mode: ModeContext;
  menu: MenuContext;
  caretPosition: CaretPosition;
};

export type FeatureContext = Context<
  | (BaseContext &
      (
        | {
            state: "LOADING_PROJECT";
          }
        | {
            state: "READY";
            commitSha: string;
            changes: GitChange[];
          }
      ))
  | {
      state: "$UPDATING_PAGE";
      pageIndex: number;
      content: string;
    }
  | {
      state: "$INSERTING_EXCALIDRAW";
      content: string;
      id: string;
      pageIndex: number;
    }
  | {
      state: "$UPDATING_EXCALIDRAW";
      id: string;
      excalidraw: Excalidraw;
    }
  | {
      state: "$ADDING_PAGE";
      pageIndex: number;
    }
  | {
      state: "$SAVING";
    }
>;

export type FeatureEvent =
  | {
      type: "UPDATE_PAGE";
      content: string;
    }
  | {
      type: "CHANGE_MODE";
      mode: ModeContext;
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

export type PrivateEvent =
  | {
      type: "INSERT_EXCALIDRAW";
    }
  | {
      type: "CHANGE_PAGE";
      index: number;
    };

export type Transition = ContextTransition<FeatureContext>;