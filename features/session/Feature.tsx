import { useContext, useReducer } from "react";
import {
  createContext,
  StateTransition,
  Transitions,
  useStateEffect,
  createReducer,
  useSubsription,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { useEnvironment } from "../../environments";
import { AuthSubscription } from "../../environments/auth";

type State =
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
    };

type Action = {
  type: "SIGN_IN";
};

type Transition = StateTransition<State>;

const featureContext = createContext<State, Action>();

const reducer = createReducer<State, Action | AuthSubscription>({
  AUTHENTICATING: {
    "AUTH:AUTHENTICATE_SUCCESS": (_, { accessToken }): Transition => ({
      state: "SIGNED_IN",
      accessToken,
    }),
    "AUTH:AUTHENTICATE_ERROR": (): Transition => ({
      // state: "SIGNED_OUT",
      state: "SIGNED_IN",
      accessToken: "123",
    }),
  },
  SIGNED_IN: {},
  SIGNED_OUT: {
    SIGN_IN: (): Transition => ({
      state: "SIGNING_IN",
    }),
  },
  SIGNING_IN: {
    "AUTH:AUTHENTICATE_SUCCESS": (_, { accessToken }): Transition => ({
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
  initialState = {
    state: "AUTHENTICATING",
  },
}: {
  children: React.ReactNode;
  initialState?: State;
}) => {
  const { auth } = useEnvironment();
  const feature = useReducer(reducer, initialState);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Session", feature);
  }

  const [state, dispatch] = feature;

  useSubsription(auth.subscription, dispatch);

  useStateEffect(state, "AUTHENTICATING", () => {
    auth.authenticate();
  });

  useStateEffect(state, "SIGNING_IN", () => {
    auth.signIn();
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
