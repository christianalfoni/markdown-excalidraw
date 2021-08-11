import { Context, ContextTransition } from "react-states";
import { Excalidraw, Page } from "../../environments/project";
import { useContext, useEffect, useReducer } from "react";
import {
  createContext,
  createReducer,
  useEnterEffect,
  useEvents,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { ProjectEvent } from "../../environments/project";
import { useEnvironment } from "../../environments";

export type { Excalidraw, Page };

export type MenuContext =
  | {
      state: "IDLE";
    }
  | {
      state: "TOC";
    };

type BaseContext = {
  pageIndex: number;
  pages: Page[];
  excalidraws: {
    [id: string]: Excalidraw;
  };
  menu: MenuContext;
};

export type FeatureContext = Context<
  | BaseContext &
      (
        | {
            state: "LOADING_PROJECT";
          }
        | {
            state: "READY";
            commitSha: string;
          }
      )
>;

export type FeatureEvent = {
  type: "TOGGLE_TOC";
};

export type PrivateEvent = {
  type: "CHANGE_PAGE";
  index: number;
};

export type Transition = ContextTransition<FeatureContext>;

const featureContext = createContext<FeatureContext, FeatureEvent>();

const reducer = createReducer<
  FeatureContext,
  FeatureEvent | PrivateEvent | ProjectEvent
>({
  LOADING_PROJECT: {
    "PROJECT:LOAD_SUCCESS": (
      { excalidraws, pages, commitSha },
      context
    ): Transition => ({
      ...context,
      state: "READY",
      excalidraws,
      pages,
      commitSha,
    }),
  },
  READY: {
    TOGGLE_TOC: (_, context): Transition => ({
      ...context,
      menu: {
        state: context.menu.state === "TOC" ? "IDLE" : "TOC",
      },
    }),
  },
});

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  page,
  initialContext = {
    state: "LOADING_PROJECT",
    pages: [],
    excalidraws: {},
    pageIndex: page,
    menu: { state: "IDLE" },
  },
}: {
  children: React.ReactNode;
  page: number;
  repoUrl: string;
  initialContext?: FeatureContext;
}) => {
  const { project } = useEnvironment();
  const feature = useReducer(reducer, initialContext);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Project", feature);
  }

  const [context, send] = feature;

  useEvents(project.events, send);

  useEffect(() => {
    send({
      type: "CHANGE_PAGE",
      index: Number(page),
    });
  }, [page]);

  useEnterEffect(context, "LOADING_PROJECT", () => {
    project.load(repoUrl);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
