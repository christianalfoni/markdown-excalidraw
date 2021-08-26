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
      { excalidraws, chapters, commitSha, changes }
    ): Transition => ({
      ...state,
      state: "READY",
      excalidraws,
      chapters,
      commitSha,
      changes,
    }),
  },
  READY: {
    "PROJECT:CHAPTERS_UPDATE": (state, { chapters }): Transition => ({
      ...state,
      chapters,
    }),
    "PROJECT:VERSION_CHECK_SUCCESS": (state, { commitSha }): Transition =>
      commitSha !== state.commitSha
        ? {
            ...state,
            version: {
              state: "BEHIND",
            },
          }
        : state,
    UPDATE_PAGE: (state, { content }): Transition => [
      state,
      {
        cmd: "UPDATE_PAGE",
        content,
        chapterIndex: state.chapterIndex,
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
      const { chapters, chapterIndex, caretPosition } = state;
      const content = chapters[chapterIndex].content;

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
            chapterIndex,
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
    ADD_CHAPTER: (state): Transition => [
      state,
      {
        cmd: "ADD_CHAPTER",
        chapterIndex: state.chapterIndex,
      },
    ],
    CHANGE_CHAPTER: (state, { index }): Transition => ({
      ...state,
      chapterIndex: index,
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
    UPDATE: (state): Transition => ({
      ...state,
      state: "UPDATING",
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
  UPDATING: {
    "PROJECT:LOAD_SUCCESS": (
      state,
      { excalidraws, chapters, commitSha, changes }
    ): Transition => ({
      ...state,
      state: "READY",
      excalidraws,
      chapters,
      commitSha,
      changes,
      version: {
        state: "UP_TO_DATE",
      },
    }),
  },
};

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  branch,
  accessToken,
  chapter,
  initialState = {
    state: "LOADING_PROJECT",
    chapters: [],
    excalidraws: {},
    chapterIndex: chapter,
    mode: { state: "READING" },
    menu: { state: "IDLE" },
    caretPosition: {
      line: 0,
      char: 0,
      absolute: 0,
    },
    version: {
      state: "UP_TO_DATE",
    },
  },
}: {
  children: React.ReactNode;
  chapter: number;
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
    function checkVersion() {
      project.checkVersion(repoUrl, branch);
    }
    const interval = setInterval(checkVersion, 60 * 1000);

    checkVersion();

    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    dispatch({
      type: "CHANGE_CHAPTER",
      index: Number(chapter),
    });
  }, [chapter]);

  useStateEffect(state, "LOADING_PROJECT", () => {
    project.load(repoUrl, branch);
  });

  useStateEffect(state, "SAVING", () => {
    project.save(repoUrl, accessToken);
  });

  useStateEffect(state, "UPDATING", () => {
    project.getLatestVersion(repoUrl, branch);
  });

  useCommandEffect(state, "UPDATE_PAGE", ({ chapterIndex, content }) => {
    project.updateChapter(repoUrl, chapterIndex, content);
  });

  useCommandEffect(state, "UPDATE_EXCALIDRAW", ({ id, excalidraw }) => {
    project.updateExcalidraw(repoUrl, id, excalidraw);
  });

  useCommandEffect(state, "INSERT_EXCALIDRAW", ({ content, chapterIndex }) => {
    project.updateChapter(repoUrl, chapterIndex, content);
  });

  useCommandEffect(state, "ADD_CHAPTER", ({ chapterIndex }) => {
    project.addChapter(repoUrl, chapterIndex + 1);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
