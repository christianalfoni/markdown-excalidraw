import { useContext } from "react";
import {
  createContext,
  StateTransition,
  Transitions,
  useCommandEffect,
  useStates,
  useSubsription,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { useEnvironment } from "../../environments";
import { ProjectSubscription } from "../../environments/project";

type State = {
  state: "IDLE";
  sandboxes: {
    [path: string]: {
      [filePath: string]: string;
    };
  };
};

type Command = {
  cmd: "LOAD_SANDBOX";
  path: string;
};

type Action = {
  type: "LOAD_SANDBOX";
  path: string;
};

type Transition = StateTransition<State, Command>;

const featureContext = createContext<State, Action>();

const transitions: Transitions<State, Action | ProjectSubscription, Command> = {
  IDLE: {
    "PROJECT:LOAD_SANDBOX_SUCCESS": (state, { path, sandbox }): Transition => ({
      ...state,
      sandboxes: {
        ...state.sandboxes,
        [path]: sandbox,
      },
    }),
    LOAD_SANDBOX: (state, { path }): Transition => [
      state,
      {
        cmd: "LOAD_SANDBOX",
        path,
      },
    ],
  },
};

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  initialState = {
    state: "IDLE",
    sandboxes: {},
  },
}: {
  children: React.ReactNode;
  repoUrl: string;
  initialState?: State;
}) => {
  const { project } = useEnvironment();
  const feature = useStates(transitions, initialState);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Sandboxes", feature);
  }

  const [state, dispatch] = feature;

  useSubsription(project.subscription, dispatch);

  useCommandEffect(state, "LOAD_SANDBOX", ({ path }) => {
    project.loadSandbox(repoUrl, path);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
