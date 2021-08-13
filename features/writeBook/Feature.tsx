import { useContext, useEffect, useReducer, useState } from "react";
import {
  createContext,
  Transitions,
  useCommandEffect,
  useStateEffect,
  useStates,
  useSubsription,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { ProjectSubscription } from "../../environments/project";
import { useEnvironment } from "../../environments";
import { useKeyboardShortcuts } from "./effects";
import { PrivateAction, Action, Transition, State, Command } from "./types";

const featureContext = createContext<State, Action>();

const transitions: Transitions<
  State,
  Action | PrivateAction | ProjectSubscription,
  Command
> = {
  LOADING_PROJECT: {
    "PROJECT:LOAD_SUCCESS": (
      { excalidraws, pages, commitSha, changes },
      state
    ): Transition => ({
      ...state,
      context: "READY",
      excalidraws,
      pages,
      commitSha,
      changes,
    }),
  },
  READY: {
    "PROJECT:PAGES_UPDATE": ({ pages }, state): Transition => ({
      ...state,
      pages,
    }),
    UPDATE_PAGE: ({ content }, state): Transition => [
      state,
      {
        cmd: "UPDATE_PAGE",
        content,
        pageIndex: state.pageIndex,
      },
    ],
    CHANGE_MODE: ({ mode }, state): Transition => ({
      ...state,
      mode,
    }),
    CHANGE_CARET_POSITION: ({ position }, state): Transition => ({
      ...state,
      caretPosition: position,
    }),
    UPDATE_EXCALIDRAW: ({ excalidraw, id }, state): Transition => [
      state,
      {
        cmd: "UPDATE_EXCALIDRAW",
        id,
        excalidraw,
      },
    ],
    TOGGLE_TOC: (_, state): Transition => ({
      ...state,
      menu: {
        context: state.menu.context === "TOC" ? "IDLE" : "TOC",
      },
    }),
    TOGGLE_GIT: (_, state): Transition => ({
      ...state,
      menu: {
        context: state.menu.context === "GIT" ? "IDLE" : "GIT",
      },
    }),
    "PROJECT:GIT_UPDATE": ({ changes }, context): Transition => ({
      ...context,
      changes,
    }),
    INSERT_EXCALIDRAW: (_, state): Transition => {
      const { pages, pageIndex, caretPosition } = state;
      const content = pages[pageIndex].content.split("\n");
      const firstLines = content.slice(0, caretPosition.line + 1);
      const lastLines = content.slice(caretPosition.line);
      const line = firstLines.pop() || "";

      if (line.length === 0) {
        const id = String(Date.now());
        const inserted = `<Excalidraw id="${id}" />`;

        return [
          {
            ...state,
            caretPosition: {
              line: caretPosition.line,
              char: caretPosition.char + inserted.length,
            },
            mode: {
              context: "DRAWING" as const,
              id,
            },
          },
          {
            cmd: "INSERT_EXCALIDRAW",
            content: [...firstLines, inserted, ...lastLines].join("\n"),
            id,
            pageIndex,
          },
        ];
      }
      const excalidrawRef = line.match(/<Excalidraw id="(.*)" \/>/);

      if (excalidrawRef) {
        return {
          ...state,
          mode: {
            context: "DRAWING",
            id: excalidrawRef[1],
          },
        };
      }

      return state;
    },
    ADD_PAGE: (_, state): Transition => [
      state,
      {
        cmd: "ADD_PAGE",
        pageIndex: state.pageIndex,
      },
    ],
    CHANGE_PAGE: ({ index }, state): Transition => ({
      ...state,
      pageIndex: index,
      caretPosition: {
        line: 0,
        char: 0,
      },
    }),
    SAVE: (_, state): Transition => ({
      ...state,
      context: "SAVING",
    }),
  },
  SAVING: {
    "PROJECT:SAVE_SUCCESS": ({ commitSha, changes }, state): Transition => ({
      ...state,
      context: "READY",
      commitSha,
      changes,
    }),
  },
};

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  branch,
  accessToken,
  page,
  initialState = {
    context: "LOADING_PROJECT",
    pages: [],
    excalidraws: {},
    pageIndex: page,
    mode: { context: "READING" },
    menu: { context: "IDLE" },
    caretPosition: {
      line: 0,
      char: 0,
    },
  },
}: {
  children: React.ReactNode;
  page: number;
  repoUrl: string;
  branch: string;
  accessToken: string;
  initialState?: State;
}) => {
  const { project } = useEnvironment();
  const feature = useStates(transitions, initialState);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Project", feature);
  }

  const [state, dispatch] = feature;

  useSubsription(project.subscription, dispatch);

  useKeyboardShortcuts(feature);

  useEffect(() => {
    dispatch({
      type: "CHANGE_PAGE",
      index: Number(page),
    });
  }, [page]);

  useStateEffect(state, "LOADING_PROJECT", () => {
    project.load(repoUrl, branch);
  });

  useStateEffect(state, "SAVING", () => {
    project.save(repoUrl, accessToken);
  });

  useCommandEffect(state, "UPDATE_PAGE", ({ pageIndex, content }) => {
    project.updatePage(repoUrl, pageIndex, content);
  });

  useCommandEffect(state, "UPDATE_EXCALIDRAW", ({ id, excalidraw }) => {
    project.updateExcalidraw(repoUrl, id, excalidraw);
  });

  useCommandEffect(state, "INSERT_EXCALIDRAW", ({ content, pageIndex }) => {
    project.updatePage(repoUrl, pageIndex, content);
  });

  useCommandEffect(state, "ADD_PAGE", ({ pageIndex }) => {
    project.addPage(repoUrl, pageIndex + 1);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
