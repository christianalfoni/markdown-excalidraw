import { useEffect, useReducer } from "react";
import {
  createContext,
  createHook,
  createReducer,
  useEnterEffect,
  useEvents,
  useTransientEffect,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { useEnvironment } from "../../environments";
import { useKeyboardShortcuts } from "./effects";
import {
  Context,
  FeatureContext,
  FeatureEvent,
  PublicEvent,
  TransientContext,
} from "./types";

const featureContext = createContext<FeatureContext, PublicEvent>();

const reducer = createReducer<FeatureContext, FeatureEvent>(
  {
    LOADING_PROJECT: {
      "PROJECT:LOAD_SUCCESS": (
        { excalidraws, pages, commitSha, changes },
        context
      ): Context => ({
        ...context,
        state: "READY",
        excalidraws,
        pages,
        commitSha,
        changes,
      }),
    },
    READY: {
      "PROJECT:PAGES_UPDATE": ({ pages }, context) => ({
        ...context,
        pages,
      }),
      UPDATE_PAGE: ({ content }, { pageIndex }): TransientContext => ({
        state: "UPDATING_PAGE",
        content,
        pageIndex,
      }),
      CHANGE_MODE: ({ mode }, context): Context => ({
        ...context,
        mode,
      }),
      CHANGE_CARET_POSITION: ({ position }, context): Context => ({
        ...context,
        caretPosition: position,
      }),
      UPDATE_EXCALIDRAW: ({ excalidraw, id }): TransientContext => ({
        state: "UPDATING_EXCALIDRAW",
        id,
        excalidraw,
      }),
      TOGGLE_TOC: (_, context) => ({
        ...context,
        menu: {
          state: context.menu.state === "TOC" ? "IDLE" : "TOC",
        },
      }),
      TOGGLE_GIT: (_, context) => ({
        ...context,
        menu: {
          state: context.menu.state === "GIT" ? "IDLE" : "GIT",
        },
      }),
      INSERT_EXCALIDRAW: (_, context) => {
        const { pages, pageIndex, caretPosition } = context;
        const content = pages[pageIndex].content.split("\n");
        const firstLines = content.slice(0, caretPosition.line + 1);
        const lastLines = content.slice(caretPosition.line);
        const line = firstLines.pop() || "";

        if (line.length === 0) {
          const id = String(Date.now());
          const inserted = `<Excalidraw id="${id}" />`;

          return {
            state: "INSERTING_EXCALIDRAW",
            caretPosition: {
              line: caretPosition.line,
              char: caretPosition.char + inserted.length,
            },
            content: [...firstLines, inserted, ...lastLines].join("\n"),
            id,
            pageIndex,
          };
        }
        const excalidrawRef = line.match(/<Excalidraw id="(.*)" \/>/);

        if (excalidrawRef) {
          return {
            ...context,
            mode: {
              state: "DRAWING",
              id: excalidrawRef[1],
            },
          };
        }

        return context;
      },
      ADD_PAGE: (_, { pageIndex }) => ({
        state: "ADDING_PAGE",
        pageIndex,
      }),
      CHANGE_PAGE: ({ index }, context) => ({
        ...context,
        pageIndex: index,
        caretPosition: {
          line: 0,
          char: 0,
        },
      }),
    },
  },
  {
    INSERTING_EXCALIDRAW: ({ id, caretPosition, content }, prevContext) => ({
      ...prevContext,
      mode: {
        state: "DRAWING",
        id,
      },
      caretPosition,
      content,
    }),
  }
);

export const useFeature = createHook(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  page,
  initialContext = {
    state: "LOADING_PROJECT",
    pages: [],
    excalidraws: {},
    pageIndex: page,
    mode: { state: "EDITING" },
    menu: { state: "IDLE" },
    caretPosition: {
      line: 0,
      char: 0,
    },
  },
}: {
  children: React.ReactNode;
  page: number;
  repoUrl: string;
  initialContext?: Context;
}) => {
  const { project } = useEnvironment();
  const feature = useReducer(reducer, initialContext);

  if (process.browser && process.env.NODE_ENV === "development") {
    useDevtools("Project", feature);
  }

  const [context, send] = feature;

  useEvents(project.events, send);

  useKeyboardShortcuts(feature);

  useEffect(() => {
    send({
      type: "CHANGE_PAGE",
      index: Number(page),
    });
  }, [page]);

  useEnterEffect(context, "LOADING_PROJECT", () => {
    project.load(repoUrl);
  });

  useTransientEffect(context, "UPDATING_PAGE", ({ pageIndex, content }) => {
    project.updatePage(repoUrl, pageIndex, content);
  });

  useTransientEffect(context, "UPDATING_EXCALIDRAW", ({ id, excalidraw }) => {
    project.updateExcalidraw(repoUrl, id, excalidraw);
  });

  useTransientEffect(
    context,
    "INSERTING_EXCALIDRAW",
    ({ content, pageIndex }) => {
      project.updatePage(repoUrl, pageIndex, content);
    }
  );

  useTransientEffect(context, "ADDING_PAGE", ({ pageIndex }) => {
    project.addPage(repoUrl, pageIndex + 1);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
