import { Dispatch, useEffect } from "react";

import { Action, PrivateAction, State } from "./types";

export const useKeyboardShortcuts = ([state, send]: [
  State,
  Dispatch<Action | PrivateAction>
]) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        if (state.mode.state === "EDITING") {
          send({
            type: "CHANGE_MODE",
            mode: { state: "READING" },
          });
        } else if (state.mode.state === "READING") {
          send({
            type: "CHANGE_MODE",
            mode: { state: "EDITING" },
          });
        }
      }

      if (event.metaKey && event.key === "e") {
        if (state.mode.state === "DRAWING") {
          send({
            type: "CHANGE_MODE",
            mode: { state: "READING" },
          });
        } else {
          send({
            type: "INSERT_EXCALIDRAW",
          });
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [state.mode]);
};
