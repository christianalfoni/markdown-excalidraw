import { useContext, useEffect } from "react";
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
      state,
      { excalidraws, pages, commitSha, changes }
    ): Transition => ({
      ...state,
      state: "READY",
      excalidraws,
      pages,
      commitSha,
      changes,
    }),
  },
  READY: {
    "PROJECT:PAGES_UPDATE": (state, { pages }): Transition => ({
      ...state,
      pages,
    }),
    UPDATE_PAGE: (state, { content }): Transition => [
      state,
      {
        cmd: "UPDATE_PAGE",
        content,
        pageIndex: state.pageIndex,
      },
    ],
    CHANGE_MODE: (state, { mode }): Transition => ({
      ...state,
      mode,
    }),
    CHANGE_CARET_POSITION: (state, { position }): Transition => ({
      ...state,
      caretPosition: position,
    }),
    UPDATE_EXCALIDRAW: (state, { excalidraw, id }): Transition => [
      state,
      {
        cmd: "UPDATE_EXCALIDRAW",
        id,
        excalidraw,
      },
    ],
    TOGGLE_TOC: (state): Transition => ({
      ...state,
      menu: {
        state: state.menu.state === "TOC" ? "IDLE" : "TOC",
      },
    }),
    TOGGLE_GIT: (state): Transition => ({
      ...state,
      menu: {
        state: state.menu.state === "GIT" ? "IDLE" : "GIT",
      },
    }),
    "PROJECT:GIT_UPDATE": (state, { changes }): Transition => ({
      ...state,
      changes,
    }),
    INSERT_EXCALIDRAW: (state): Transition => {
      const { pages, pageIndex, caretPosition } = state;
      const content = pages[pageIndex].content;

      if (
        caretPosition.char === 0 &&
        (content[caretPosition.absolute] === "\n" ||
          content[caretPosition.absolute] === undefined)
      ) {
        const id = String(Date.now());

        return [
          {
            ...state,
            mode: {
              state: "DRAWING",
              id,
            },
          },
          {
            cmd: "INSERT_EXCALIDRAW",
            content:
              content.slice(0, caretPosition.absolute) +
              `<Excalidraw id="${id}" />` +
              content.slice(caretPosition.absolute),
            id,
            pageIndex,
          },
        ];
      }

      let excalidrawRef = content
        .slice(caretPosition.absolute)
        .match(/<Excalidraw id="(.*)" \/>/);

      if (excalidrawRef) {
        return {
          ...state,
          mode: {
            state: "DRAWING",
            id: excalidrawRef[1],
          },
        };
      }

      return state;
    },
    ADD_PAGE: (state): Transition => [
      state,
      {
        cmd: "ADD_PAGE",
        pageIndex: state.pageIndex,
      },
    ],
    CHANGE_PAGE: (state, { index }): Transition => ({
      ...state,
      pageIndex: index,
      caretPosition: {
        line: 0,
        char: 0,
        absolute: 0,
      },
    }),
    SAVE: (state): Transition => ({
      ...state,
      state: "SAVING",
    }),
  },
  SAVING: {
    "PROJECT:SAVE_SUCCESS": (state, { commitSha, changes }): Transition => ({
      ...state,
      state: "READY",
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
    state: "LOADING_PROJECT",
    pages: [],
    excalidraws: {},
    pageIndex: page,
    mode: { state: "READING" },
    menu: { state: "IDLE" },
    caretPosition: {
      line: 0,
      char: 0,
      absolute: 0,
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
