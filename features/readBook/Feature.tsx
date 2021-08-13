import {
  StateTransition,
  Transitions,
  useStateEffect,
  useStates,
  useSubsription,
} from "react-states";
import { Excalidraw, Page, Project } from "../../environments/project";
import { useContext, useEffect, useReducer } from "react";
import { createContext } from "react-states";
import { useDevtools } from "react-states/devtools";
import { ProjectSubscription } from "../../environments/project";
import { useEnvironment } from "../../environments";

export type { Excalidraw, Page };

export type MenuState =
  | {
      context: "IDLE";
    }
  | {
      context: "TOC";
    };

type BaseState = {
  pageIndex: number;
  pages: Page[];
  excalidraws: {
    [id: string]: Excalidraw;
  };
  menu: MenuState;
};

export type State = BaseState &
  (
    | {
        context: "LOADING_PROJECT";
      }
    | {
        context: "READY";
        commitSha: string;
      }
  );

export type Action = {
  type: "TOGGLE_TOC";
};

export type PrivateAction = {
  type: "CHANGE_PAGE";
  index: number;
};

export type Transition = StateTransition<State>;

const featureContext = createContext<State, Action>();

const transitions: Transitions<
  State,
  Action | PrivateAction | ProjectSubscription
> = {
  LOADING_PROJECT: {
    "PROJECT:LOAD_SUCCESS": (
      { excalidraws, pages, commitSha },
      state
    ): Transition => ({
      ...state,
      context: "READY",
      excalidraws,
      pages,
      commitSha,
    }),
  },
  READY: {
    TOGGLE_TOC: (_, state): Transition => ({
      ...state,
      menu: {
        context: state.menu.context === "TOC" ? "IDLE" : "TOC",
      },
    }),
  },
};

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  branch,
  page,
  initialState = {
    context: "LOADING_PROJECT",
    pages: [],
    excalidraws: {},
    pageIndex: page,
    menu: { context: "IDLE" },
  },
}: {
  children: React.ReactNode;
  branch: string;
  page: number;
  repoUrl: string;
  initialState?: State;
}) => {
  const { project } = useEnvironment();
  const feature = useStates(transitions, initialState);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Project", feature);
  }

  const [state, dispatch] = feature;

  useSubsription(project.subscription, dispatch);

  useEffect(() => {
    dispatch({
      type: "CHANGE_PAGE",
      index: Number(page),
    });
  }, [page]);

  useStateEffect(state, "LOADING_PROJECT", () => {
    project.load(repoUrl, branch);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
