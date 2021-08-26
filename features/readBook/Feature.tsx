import {
  StateTransition,
  Transitions,
  useStateEffect,
  useStates,
  useSubsription,
} from "react-states";
import { Excalidraw, Chapter } from "../../environments/project";
import { useContext, useEffect } from "react";
import { createContext } from "react-states";
import { useDevtools } from "react-states/devtools";
import { ProjectSubscription } from "../../environments/project";
import { useEnvironment } from "../../environments";

export type { Excalidraw, Chapter as Page };

export type MenuState =
  | {
      state: "IDLE";
    }
  | {
      state: "TOC";
    };

type BaseState = {
  chapterIndex: number;
  chapters: Chapter[];
  excalidraws: {
    [id: string]: Excalidraw;
  };
  menu: MenuState;
};

export type State = BaseState &
  (
    | {
        state: "LOADING_PROJECT";
      }
    | {
        state: "READY";
        commitSha: string;
      }
  );

export type Action = {
  type: "TOGGLE_TOC";
};

export type PrivateAction = {
  type: "CHANGE_CHAPTER";
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
      state,
      { excalidraws, chapters, commitSha }
    ): Transition => ({
      ...state,
      state: "READY",
      excalidraws,
      chapters,
      commitSha,
    }),
  },
  READY: {
    TOGGLE_TOC: (state): Transition => ({
      ...state,
      menu: {
        state: state.menu.state === "TOC" ? "IDLE" : "TOC",
      },
    }),
  },
};

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  branch,
  chapter,
  initialState = {
    state: "LOADING_PROJECT",
    chapters: [],
    excalidraws: {},
    chapterIndex: chapter,
    menu: { state: "IDLE" },
  },
}: {
  children: React.ReactNode;
  branch: string;
  chapter: number;
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
      type: "CHANGE_CHAPTER",
      index: Number(chapter),
    });
  }, [chapter]);

  useStateEffect(state, "LOADING_PROJECT", () => {
    project.load(repoUrl, branch);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
