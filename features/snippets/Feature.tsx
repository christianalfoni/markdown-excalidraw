import { createContext, Dispatch, useContext, useReducer } from "react";
import {
  Context,
  ContextTransition,
  transition,
  useEnterEffect,
  useEvents,
  useTransientEffect,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { useEnvironment } from "../../environments";
import { ProjectEvent } from "../../environments/project";

type FeatureContext = Context<
  | {
      state: "IDLE";
      snippets: {
        [path: string]: string;
      };
    }
  | {
      state: "$LOADING_SNIPPET";
      path: string;
    }
>;

type FeatureEvent = {
  type: "LOAD_SNIPPET";
  path: string;
};

type Transition = ContextTransition<FeatureContext>;

const featureContext = createContext<[FeatureContext, Dispatch<FeatureEvent>]>(
  [] as any
);

const reducer = (context: FeatureContext, event: FeatureEvent | ProjectEvent) =>
  transition(context, event, {
    IDLE: {
      "PROJECT:LOAD_SNIPPET_SUCCESS": (
        { path, code },
        context
      ): Transition => ({
        ...context,
        snippets: {
          ...context.snippets,
          [path]: code,
        },
      }),
      LOAD_SNIPPET: ({ path }, context): Transition => [
        {
          state: "$LOADING_SNIPPET",
          path,
        },
        context,
      ],
    },
  });

export const useFeature = () => useContext(featureContext);

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

  useTransientEffect(context, "$LOADING_SNIPPET", ({ path }) => {
    project.loadSnippet(repoUrl, path);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
