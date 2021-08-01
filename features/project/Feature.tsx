import { useReducer } from "react";
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
      "PROJECT:LOAD_SUCCESS": ({ excalidraws, pages }, context): Context => ({
        ...context,
        state: "READY",
        excalidraws,
        pages,
      }),
    },
    READY: {
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
        toc: {
          state: context.toc.state === "VISIBLE" ? "HIDDEN" : "VISIBLE",
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
  initialContext = {
    state: "LOADING_PROJECT",
    pages: [],
    excalidraws: {},
    pageIndex: 0,
    mode: { state: "EDITING" },
    toc: { state: "HIDDEN" },
    caretPosition: {
      line: 0,
      char: 0,
    },
  },
}: {
  children: React.ReactNode;
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

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
