import { Dispatch, useContext, useReducer } from "react";
import {
  createContext,
  StateTransition,
  Transitions,
  useCommandEffect,
  createReducer,
  useSubsription,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { useEnvironment } from "../../environments";
import { ProjectSubscription } from "../../environments/project";

type State = {
  state: "IDLE";
  snippets: {
    [path: string]: string;
  };
};

type Command = {
  cmd: "LOAD_SNIPPET";
  path: string;
};

type Action = {
  type: "LOAD_SNIPPET";
  path: string;
};

type Transition = StateTransition<State, Command>;

const featureContext = createContext<State, Action>();

const reducer = createReducer<State, Action | ProjectSubscription, Command>({
  IDLE: {
    "PROJECT:LOAD_SNIPPET_SUCCESS": (state, { path, code }): Transition => ({
      ...state,
      snippets: {
        ...state.snippets,
        [path]: code,
      },
    }),
    LOAD_SNIPPET: (state, { path }): Transition => [
      state,
      {
        cmd: "LOAD_SNIPPET",
        path,
      },
    ],
  },
});

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  initialState = {
    state: "IDLE",
    snippets: {},
  },
}: {
  children: React.ReactNode;
  repoUrl: string;
  initialState?: State;
}) => {
  const { project } = useEnvironment();
  const feature = useReducer(reducer, initialState);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Snippets", feature);
  }

  const [state, dispatch] = feature;

  useSubsription(project.subscription, dispatch);

  useCommandEffect(state, "LOAD_SNIPPET", ({ path }) => {
    project.loadSnippet(repoUrl, path);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
