import { useEffect } from "react";
import { Feature } from "./types";

export const useKeyboardShortcuts = ([context, send]: Feature) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        if (context.mode.state === "EDITING") {
          send({
            type: "CHANGE_MODE",
            mode: { state: "READING" },
          });
        } else if (context.mode.state === "READING") {
          send({
            type: "CHANGE_MODE",
            mode: { state: "EDITING" },
          });
        }
      }

      if (event.metaKey && event.key === "e") {
        if (context.mode.state === "DRAWING") {
          send({
            type: "CHANGE_MODE",
            mode: { state: "EDITING" },
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
  }, [context.mode]);
};
