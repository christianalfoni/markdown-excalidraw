import { useReducer } from "react";
import {
  createContext,
  createHook,
  createReducer,
  useEvents,
  useTransientEffect,
  WithTransientContext,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { useEnvironment } from "../../environments";
import { ProjectEvent } from "../../environments/project";

type Context = {
  state: "IDLE";
  snippets: {
    [path: string]: string;
  };
};

type TransientContext = {
  state: "LOADING_SNIPPET";
  path: string;
};

type FeatureContext = WithTransientContext<TransientContext, Context>;

type PublicEvent = {
  type: "LOAD_SNIPPET";
  path: string;
};

type FeatureEvent = PublicEvent | ProjectEvent;

const featureContext = createContext<FeatureContext, PublicEvent>();

const reducer = createReducer<FeatureContext, FeatureEvent>({
  IDLE: {
    "PROJECT:LOAD_SNIPPET_SUCCESS": ({ path, code }, context) => ({
      ...context,
      snippets: {
        ...context.snippets,
        [path]: code,
      },
    }),
    LOAD_SNIPPET: ({ path }) => ({
      state: "LOADING_SNIPPET",
      path,
    }),
  },
});

export const useFeature = createHook(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  initialContext = {
    state: "IDLE",
    snippets: {},
  },
}: {
  children: React.ReactNode;
  repoUrl: string;
  initialContext?: FeatureContext;
}) => {
  const { project } = useEnvironment();
  const feature = useReducer(reducer, initialContext);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Snippets", feature);
  }

  const [context, send] = feature;

  useEvents(project.events, send);

  useTransientEffect(context, "LOADING_SNIPPET", ({ path }) => {
    project.loadSnippet(repoUrl, path);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
