import { createContext, Dispatch, useContext, useReducer } from "react";
import {
  Context,
  ContextTransition,
  transition,
  useEnterEffect,
  useEvents,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { useEnvironment } from "../../environments";
import { AuthEvent } from "../../environments/auth";

type FeatureContext = Context<
  | {
      state: "AUTHENTICATING";
    }
  | {
      state: "SIGNED_OUT";
    }
  | {
      state: "SIGNING_IN";
    }
  | {
      state: "SIGNED_IN";
      accessToken: string;
    }
>;

type FeatureEvent = {
  type: "SIGN_IN";
};

type Transition = ContextTransition<FeatureContext>;

const featureContext = createContext<[FeatureContext, Dispatch<FeatureEvent>]>(
  [] as any
);

const reducer = (context: FeatureContext, event: FeatureEvent | AuthEvent) =>
  transition(context, event, {
    AUTHENTICATING: {
      "AUTH:AUTHENTICATE_SUCCESS": ({ accessToken }): Transition => ({
        state: "SIGNED_IN",
        accessToken,
      }),
      "AUTH:AUTHENTICATE_ERROR": (): Transition => ({
        state: "SIGNED_OUT",
      }),
    },
    SIGNED_IN: {},
    SIGNED_OUT: {
      SIGN_IN: (): Transition => ({
        state: "SIGNING_IN",
      }),
    },
    SIGNING_IN: {
      "AUTH:AUTHENTICATE_SUCCESS": ({ accessToken }): Transition => ({
        state: "SIGNED_IN",
        accessToken,
      }),
      "AUTH:AUTHENTICATE_ERROR": (): Transition => ({
        state: "SIGNED_OUT",
      }),
    },
  });

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  initialContext = {
    state: "AUTHENTICATING",
  },
}: {
  children: React.ReactNode;
  initialContext?: FeatureContext;
}) => {
  const { auth } = useEnvironment();
  const feature = useReducer(reducer, initialContext);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Session", feature);
  }

  const [context, send] = feature;

  useEvents(auth.events, send);

  useEnterEffect(context, "AUTHENTICATING", () => {
    auth.authenticate();
  });

  useEnterEffect(context, "SIGNING_IN", () => {
    auth.signIn();
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
