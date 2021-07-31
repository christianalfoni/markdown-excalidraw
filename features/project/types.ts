import { States, WithTransientContext } from "react-states";
import { Excalidraw, Page, ProjectEvent } from "../../environments/project";

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

export type TocContext =
  | {
      state: "VISIBLE";
    }
  | {
      state: "HIDDEN";
    };

type BaseContext = {
  pageIndex: number;
  pages: Page[];
  excalidraws: {
    [id: string]: Excalidraw;
  };
  mode: ModeContext;
  toc: TocContext;
  caretPosition: number;
};

export type Context = BaseContext &
  (
    | {
        state: "LOADING_PROJECT";
      }
    | {
        state: "READY";
      }
  );

export type TransientContext =
  | {
      state: "UPDATING_PAGE";
      pageIndex: number;
      content: string;
    }
  | {
      state: "INSERTING_EXCALIDRAW";
      caretPosition: number;
      content: string;
      id: string;
      pageIndex: number;
    }
  | {
      state: "UPDATING_EXCALIDRAW";
      id: string;
      excalidraw: Excalidraw;
    };

export type PublicEvent =
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
      position: number;
    }
  | {
      type: "UPDATE_EXCALIDRAW";
      id: string;
      excalidraw: Excalidraw;
    }
  | {
      type: "TOGGLE_TOC";
    };

export type PrivateEvent = {
  type: "INSERT_EXCALIDRAW";
};

export type FeatureContext = WithTransientContext<TransientContext, Context>;

export type FeatureEvent = PrivateEvent | PublicEvent | ProjectEvent;

export type Feature = States<FeatureContext, PrivateEvent | PublicEvent>;
