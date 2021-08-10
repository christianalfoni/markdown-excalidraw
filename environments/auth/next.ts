import { events } from "react-states";
import { Auth } from ".";

export const createAuth = (): Auth => ({
  events: events(),
  authenticate() {},
  signIn() {},
  signOut() {},
});
