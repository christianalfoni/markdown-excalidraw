import { signIn, signOut, getSession } from "next-auth/client";
import { events } from "react-states";
import { Auth } from ".";

export const createAuth = (): Auth => {
  return {
    events: events(),
    authenticate() {
      getSession()
        .then((session) => {
          if (session) {
            this.events.emit({
              type: "AUTH:AUTHENTICATE_SUCCESS",
              accessToken: session.accessToken as string,
            });
          } else {
            this.events.emit({
              type: "AUTH:AUTHENTICATE_ERROR",
              error: "Not signed in",
            });
          }
        })
        .catch((error) => {
          this.events.emit({
            type: "AUTH:AUTHENTICATE_ERROR",
            error: error.message,
          });
        });
    },
    signIn() {
      signIn()
        .then(() => getSession())
        .then((session) => {
          if (session) {
            this.events.emit({
              type: "AUTH:SIGN_IN_SUCCESS",
              accessToken: session.accessToken as string,
            });
          } else {
            this.events.emit({
              type: "AUTH:SIGN_IN_ERROR",
              error: "No session",
            });
          }
        })
        .catch((error) => {
          this.events.emit({
            type: "AUTH:SIGN_IN_ERROR",
            error: error.message,
          });
        });
    },
    signOut() {
      signOut()
        .then(() => {
          this.events.emit({
            type: "AUTH:SIGN_OUT_SUCCESS",
          });
        })
        .catch((error) => {
          this.events.emit({
            type: "AUTH:SIGN_OUT_ERROR",
            error: error.message,
          });
        });
    },
  };
};
