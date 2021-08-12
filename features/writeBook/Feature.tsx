import { useContext, useEffect, useReducer } from "react";
import {
  createContext,
  createReducer,
  useEnterEffect,
  useEvents,
  useTransientEffect,
} from "react-states";
import { useDevtools } from "react-states/devtools";
import { ProjectEvent } from "../../environments/project";
import { useEnvironment } from "../../environments";
import { useKeyboardShortcuts } from "./effects";
import {
  FeatureContext,
  PrivateEvent,
  FeatureEvent,
  Transition,
} from "./types";

const featureContext = createContext<FeatureContext, FeatureEvent>();

const reducer = createReducer<
  FeatureContext,
  FeatureEvent | PrivateEvent | ProjectEvent
>({
  LOADING_PROJECT: {
    "PROJECT:LOAD_SUCCESS": (
      { excalidraws, pages, commitSha, changes },
      context
    ): Transition => ({
      ...context,
      state: "READY",
      excalidraws,
      pages,
      commitSha,
      changes,
    }),
  },
  READY: {
    "PROJECT:PAGES_UPDATE": ({ pages }, context): Transition => ({
      ...context,
      pages,
    }),
    UPDATE_PAGE: ({ content }, context): Transition => [
      {
        state: "$UPDATING_PAGE",
        content,
        pageIndex: context.pageIndex,
      },
      context,
    ],
    CHANGE_MODE: ({ mode }, context): Transition => ({
      ...context,
      mode,
    }),
    CHANGE_CARET_POSITION: ({ position }, context): Transition => ({
      ...context,
      caretPosition: position,
    }),
    UPDATE_EXCALIDRAW: ({ excalidraw, id }, context): Transition => [
      {
        state: "$UPDATING_EXCALIDRAW",
        id,
        excalidraw,
      },
      context,
    ],
    TOGGLE_TOC: (_, context): Transition => ({
      ...context,
      menu: {
        state: context.menu.state === "TOC" ? "IDLE" : "TOC",
      },
    }),
    TOGGLE_GIT: (_, context): Transition => ({
      ...context,
      menu: {
        state: context.menu.state === "GIT" ? "IDLE" : "GIT",
      },
    }),
    "PROJECT:GIT_UPDATE": ({ changes }, context): Transition => ({
      ...context,
      changes,
    }),
    INSERT_EXCALIDRAW: (_, context): Transition => {
      const { pages, pageIndex, caretPosition } = context;
      const content = pages[pageIndex].content.split("\n");
      const firstLines = content.slice(0, caretPosition.line + 1);
      const lastLines = content.slice(caretPosition.line);
      const line = firstLines.pop() || "";

      if (line.length === 0) {
        const id = String(Date.now());
        const inserted = `<Excalidraw id="${id}" />`;

        return [
          {
            state: "$INSERTING_EXCALIDRAW",
            content: [...firstLines, inserted, ...lastLines].join("\n"),
            id,
            pageIndex,
          },
          {
            ...context,
            caretPosition: {
              line: caretPosition.line,
              char: caretPosition.char + inserted.length,
            },
            mode: {
              state: "DRAWING" as const,
              id,
            },
          },
        ];
      }
      const excalidrawRef = line.match(/<Excalidraw id="(.*)" \/>/);

      if (excalidrawRef) {
        return {
          ...context,
          mode: {
            state: "DRAWING" as const,
            id: excalidrawRef[1],
          },
        };
      }

      return context;
    },
    ADD_PAGE: (_, context): Transition => [
      {
        state: "$ADDING_PAGE",
        pageIndex: context.pageIndex,
      },
      context,
    ],
    CHANGE_PAGE: ({ index }, context): Transition => ({
      ...context,
      pageIndex: index,
      caretPosition: {
        line: 0,
        char: 0,
      },
    }),
    SAVE: (_, context): Transition => ({
      ...context,
      state: "SAVING",
    }),
  },
  SAVING: {
    "PROJECT:SAVE_SUCCESS": ({ commitSha, changes }, context) => ({
      ...context,
      state: "READY",
      commitSha,
      changes,
    }),
  },
});

export const useFeature = () => useContext(featureContext);

export const FeatureProvider = ({
  children,
  repoUrl,
  accessToken,
  page,
  initialContext = {
    state: "LOADING_PROJECT",
    pages: [],
    excalidraws: {},
    pageIndex: page,
    mode: { state: "READING" },
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
  accessToken: string;
  initialContext?: FeatureContext;
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

  useTransientEffect(context, "$UPDATING_PAGE", ({ pageIndex, content }) => {
    project.updatePage(repoUrl, pageIndex, content);
  });

  useTransientEffect(context, "$UPDATING_EXCALIDRAW", ({ id, excalidraw }) => {
    project.updateExcalidraw(repoUrl, id, excalidraw);
  });

  useTransientEffect(
    context,
    "$INSERTING_EXCALIDRAW",
    ({ content, pageIndex }) => {
      project.updatePage(repoUrl, pageIndex, content);
    }
  );

  useTransientEffect(context, "$ADDING_PAGE", ({ pageIndex }) => {
    project.addPage(repoUrl, pageIndex + 1);
  });

  useEnterEffect(context, "SAVING", () => {
    project.save(repoUrl, accessToken);
  });

  return (
    <featureContext.Provider value={feature}>
      {children}
    </featureContext.Provider>
  );
};
