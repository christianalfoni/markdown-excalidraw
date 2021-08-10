import { Events } from "react-states";

export type AuthEvent =
  | {
      type: "AUTH:AUTHENTICATE_SUCCESS";
      accessToken: string;
    }
  | {
      type: "AUTH:AUTHENTICATE_ERROR";
      error: string;
    }
  | {
      type: "AUTH:SIGN_IN_SUCCESS";
      accessToken: string;
    }
  | {
      type: "AUTH:SIGN_IN_ERROR";
      error: string;
    }
  | {
      type: "AUTH:SIGN_OUT_SUCCESS";
    }
  | {
      type: "AUTH:SIGN_OUT_ERROR";
      error: string;
    };

export interface Auth {
  events: Events<AuthEvent>;
  authenticate(): void;
  signIn(): void;
  signOut(): void;
}
