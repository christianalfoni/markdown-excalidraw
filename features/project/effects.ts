import { useEffect } from "react";
import { Feature } from "./types";

export const useKeyboardShortcuts = ([context, send]: Feature) => {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        event.preventDefault();
        if (context.mode.type === "EDIT") {
          send({
            type: "CHANGE_MODE",
            mode: { type: "READ" },
          });
        } else if (context.mode.type === "READ") {
          send({
            type: "CHANGE_MODE",
            mode: { type: "EDIT" },
          });
        }
      }

      if (event.metaKey && event.key === "e") {
        if (context.mode.type === "EXCALIDRAW") {
          send({
            type: "CHANGE_MODE",
            mode: { type: "EDIT" },
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
