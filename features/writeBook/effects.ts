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
        if (state.mode.context === "EDITING") {
          send({
            type: "CHANGE_MODE",
            mode: { context: "READING" },
          });
        } else if (state.mode.context === "READING") {
          send({
            type: "CHANGE_MODE",
            mode: { context: "EDITING" },
          });
        }
      }

      if (event.metaKey && event.key === "e") {
        if (state.mode.context === "DRAWING") {
          send({
            type: "CHANGE_MODE",
            mode: { context: "EDITING" },
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
