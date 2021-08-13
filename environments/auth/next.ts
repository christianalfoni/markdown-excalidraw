import { subscription } from "react-states";
import { Auth } from ".";

export const createAuth = (): Auth => ({
  subscription: subscription(),
  authenticate() {},
  signIn() {},
  signOut() {},
});
