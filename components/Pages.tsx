import Markdown, { MarkdownToJSX } from "markdown-to-jsx";
import Image from "next/image";
import * as pathUtil from "path";
import React, { useContext, useEffect, useState } from "react";
import SyntaxHighlighter from "react-syntax-highlighter";
import { Page } from "../features/writeBook";
import { useSnippets } from "../features/snippets";
import { usePageState } from "../utils/usePageState";
import { excalidrawsContext } from "./ExcalidrawsProvider";

const codeStyle = {
  hljs: {
    display: "block",
    overflowX: "auto",
    marginTop: "1em",
    marginBottom: "1em",
    color: "#374151",
    background: "transparent",
    fontSize: "14px",
  },
  "hljs-comment": {
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  "hljs-quote": {
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  "hljs-keyword": {
    color: "#3B82F6",
    fontWeight: "bold",
  },
  "hljs-selector-tag": {
    color: "#EF4444",
    fontWeight: "bold",
  },
  "hljs-subst": {
    color: "#EF4444",
    fontWeight: "normal",
  },
  "hljs-number": {
    color: "#3B82F6",
  },
  "hljs-literal": {
    color: "#F59E0B",
  },
  "hljs-variable": {
    color: "#374151",
  },
  "hljs-template-variable": {
    color: "#374151",
  },
  "hljs-tag .hljs-attr": {
    color: "#EF4444",
  },
  "hljs-string": {
    color: "#F59E0B",
  },
  "hljs-doctag": {
    color: "#d14",
  },
  "hljs-title": {
    color: "#900",
    fontWeight: "bold",
  },
  "hljs-section": {
    color: "#900",
    fontWeight: "bold",
  },
  "hljs-selector-id": {
    color: "#900",
    fontWeight: "bold",
  },
  "hljs-type": {
    color: "#458",
    fontWeight: "bold",
  },
  "hljs-class .hljs-title": {
    color: "#458",
    fontWeight: "bold",
  },
  "hljs-tag": {
    color: "#EF4444",
    fontWeight: "normal",
  },
  "hljs-name": {
    color: "#EF4444",
    fontWeight: "normal",
  },
  "hljs-attribute": {
    color: "#000080",
    fontWeight: "normal",
  },
  "hljs-regexp": {
    color: "#009926",
  },
  "hljs-link": {
    color: "#009926",
  },
  "hljs-symbol": {
    color: "#990073",
  },
  "hljs-bullet": {
    color: "#990073",
  },
  "hljs-built_in": {
    color: "#0086b3",
  },
  "hljs-builtin-name": {
    color: "#0086b3",
  },
  "hljs-meta": {
    color: "#999",
    fontWeight: "bold",
  },
  "hljs-deletion": {
    background: "#fdd",
  },
  "hljs-addition": {
    background: "#dfd",
  },
  "hljs-emphasis": {
    fontStyle: "italic",
  },
  "hljs-strong": {
    fontWeight: "bold",
  },
};

const options: MarkdownToJSX.Options = {
  overrides: {
    h1({ children }) {
      return <h1 className="text-3xl font-medium text-gray-700">{children}</h1>;
    },
    p({ children }) {
      return <p className="my-4 text-gray-600">{children}</p>;
    },
    ul({ children }) {
      return <ul className="list-disc ml-8">{children}</ul>;
    },
    Snippet({ path, from, to }) {
      const [context, send] = useSnippets();
      const language = {
        ".tsx": "typescript",
      }[pathUtil.extname(path)];
      const code = context.snippets[path]
        ? context.snippets[path].split("\n").slice(from - 1, to)
        : Array(to - from).fill("");

      useEffect(() => {
        send({
          type: "LOAD_SNIPPET",
          path,
        });
      }, []);

      return (
        <SyntaxHighlighter
          language={language}
          style={codeStyle}
          showLineNumbers
          startingLineNumber={Number(from)}
          lineNumberStyle={{
            width: "40px",
            minWidth: "auto",
          }}
        >
          {code.join("\n")}
        </SyntaxHighlighter>
      );
    },
    Code({ children, language }) {
      return (
        <SyntaxHighlighter language={language} style={codeStyle}>
          {children}
        </SyntaxHighlighter>
      );
    },
    Excalidraw({ id }) {
      const excalidraws = useContext(excalidrawsContext);
      const excalidraw = excalidraws[id];
      const [exportToCanvas, setExportToCanvas] = useState<Function | null>(
        null
      );

      useEffect(() => {
        import("@excalidraw/excalidraw").then((comp) =>
          setExportToCanvas(() => comp.exportToCanvas)
        );
      }, []);

      if (exportToCanvas) {
        const canvas = exportToCanvas({
          elements: excalidraw.elements,
          appState: excalidraw.appState,
        });
        return (
          <Image
            src={canvas.toDataURL()}
            width={canvas.width}
            height={canvas.height}
          />
        );
      }

      return null;
    },
  },
};

export const Pages = ({ pages }: { pages: Page[] }) => {
  const { index, flip, next, prev } = usePageState();

  return (
    <div className="cover">
      <div className="book">
        <div
          className="book__page book__page--1 bg-gray-50 rounded-md py-4 px-6 border-gray-500 border"
          onClick={() => {
            prev();
          }}
        >
          <Markdown options={options}>{pages[index]?.content ?? ""}</Markdown>
          <span className="absolute bottom-2 left-2 text-xs text-gray-500">
            Page {index + 1}
          </span>
        </div>

        <div className="book__page book__page--4 bg-gray-50 rounded-md py-4 px-6 border-gray-500 border">
          <Markdown options={options}>
            {pages[index + 3]?.content ?? ""}
          </Markdown>
          <span className="absolute bottom-2 right-2 text-xs text-gray-500">
            Page {index + 4}
          </span>
        </div>
        <div
          className={
            "book__page book__page--2" +
            {
              0: "",
              1: " transition-flip",
              2: " flip",
              3: " flip-2",
            }[flip]
          }
        >
          <div
            className="book__page-front bg-gray-50 rounded-md py-4 px-6 border-gray-500 border"
            onClick={() => {
              next();
            }}
          >
            <Markdown options={options}>
              {pages[index + 1]?.content ?? ""}
            </Markdown>
            <span className="absolute bottom-2 right-2 text-xs text-gray-500">
              Page {index + 2}
            </span>
          </div>
          <div className="book__page-back bg-gray-50 rounded-md py-4 px-6 border-gray-500 border">
            <Markdown options={options}>
              {pages[index + 2]?.content ?? ""}
            </Markdown>
            <span className="absolute bottom-2 left-2 text-xs text-gray-500">
              Page {index + 3}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
