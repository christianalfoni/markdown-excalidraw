import { useEffect, useReducer } from "react";
import {
  useEnterEffect,
  ContextTransition,
  createReducer,
  useTransientEffect,
  Context,
} from "react-states";

import { useCanvas } from "./useCanvas";

const LINE_HEIGHT = 30;
const PADDING = 10;
const LINE_LENGTH = 75;
const FONT_SIZE = 16;

type BaseContext = {
  lines: string[];
  line: number;
  char: number;
  lastPositioning: number;
};

type EditorContext = Context<
  | (BaseContext & {
      state: "IDLE";
    })
  | {
      state: "$INSERTING";
      key: string;
      line: number;
      lines: string[];
      char: number;
    }
  | {
      state: "$REMOVING";
      line: number;
      lines: string[];
      char: number;
    }
  | {
      state: "$CHANGING_POSITION";
      lines: string[];
      prevLines: string[];
      prevLine: number;
      line: number;
      char: number;
    }
>;

type EditorEvent =
  | {
      type: "CHAR_INSERT";
      key: string;
    }
  | {
      type: "CHAR_REMOVE";
    }
  | {
      type: "NEW_LINE";
    }
  | {
      type: "PREV_LINE";
    }
  | {
      type: "NEXT_LINE";
    }
  | {
      type: "PREV_CHAR";
    }
  | {
      type: "NEXT_CHAR";
    }
  | {
      type: "PREV_WORD";
    }
  | {
      type: "NEXT_WORD";
    }
  | {
      type: "PREV_PARAGRAPH";
    }
  | {
      type: "NEXT_PARAGRAPH";
    };

type Transition = ContextTransition<EditorContext>;

const changePosition = (
  context: EditorContext,
  {
    line,
    lines,
    char,
  }: {
    lines: string[];
    line: number;
    char: number;
  }
): Transition => {
  return [
    {
      state: "$CHANGING_POSITION",
      char,
      line,
      lines,
      prevLine: context.line,
      prevLines: context.lines,
    },
    {
      ...context,
      line,
      lines,
      char,
      lastPositioning: Date.now(),
    },
  ];
};

const reducer = createReducer<EditorContext, EditorEvent>({
  IDLE: {
    CHAR_INSERT: ({ key }, context): Transition => {
      const { lines, line, char } = context;

      if (lines[line].length === LINE_LENGTH) {
        const currentWords = lines[line].split(" ");
        const lastWord = currentWords.pop() || "";

        return changePosition(context, {
          char: lastWord.length + 1,
          line: line + 1,
          lines: [
            ...lines.slice(0, line),
            currentWords.join(" "),
            lastWord + key,
            ...lines.slice(line + 1),
          ],
        });
      }

      const newLines = [
        ...lines.slice(0, line),
        lines[line].slice(0, char) + key + lines[line].slice(char),
        ...lines.slice(line + 1),
      ];
      const newChar = char + 1;

      return [
        {
          state: "$INSERTING",
          key,
          line,
          lines: newLines,
          char: newChar,
        },
        {
          ...context,
          lines: newLines,
          char: newChar,
        },
      ];
    },
    CHAR_REMOVE: (_, context): Transition => {
      const { lines, line, char } = context;

      if (char === 0 && line === 0) {
        return context;
      }

      if (char === 0) {
        return changePosition(context, {
          line: line - 1,
          char: lines[line - 1].length,
          lines: [...lines.slice(0, line), ...lines.slice(line + 1)],
        });
      }

      const newLines = [
        ...lines.slice(0, line),
        lines[line].slice(0, char - 1) + lines[line].slice(char),
        ...lines.slice(line + 1),
      ];
      const newChar = char - 1;

      return [
        {
          state: "$REMOVING",
          line,
          lines: newLines,
          char: newChar,
        },
        {
          ...context,
          lines: newLines,
          char: newChar,
        },
      ];
    },
    NEW_LINE: (_, context): Transition => {
      const { line, lines } = context;

      return changePosition(context, {
        line: line + 1,
        char: 0,
        lines: [...lines.slice(0, line + 1), "", ...lines.slice(line + 1)],
      });
    },
    NEXT_LINE: (_, context): Transition => {
      if (context.line + 1 >= context.lines.length) {
        return context;
      }

      return changePosition(context, {
        line: context.line + 1,
        char: Math.min(context.lines[context.line + 1].length, context.char),
        lines: context.lines,
      });
    },
    PREV_LINE: (_, context): Transition => {
      if (context.line - 1 < 0) {
        return context;
      }

      return changePosition(context, {
        line: context.line - 1,
        char: Math.min(context.lines[context.line - 1].length, context.char),
        lines: context.lines,
      });
    },
    NEXT_CHAR: (_, context): Transition => {
      const { char, lines, line } = context;
      if (char < lines[line].length) {
        return changePosition(context, {
          line: context.line,
          char: char + 1,
          lines: context.lines,
        });
      } else if (line + 1 < lines.length) {
        return changePosition(context, {
          line: line + 1,
          char: 0,
          lines: context.lines,
        });
      }

      return context;
    },
    PREV_CHAR: (_, context): Transition => {
      const { char, lines, line } = context;
      if (char > 0) {
        return changePosition(context, {
          line,
          char: char - 1,
          lines,
        });
      } else if (line > 0) {
        return changePosition(context, {
          line: line - 1,
          char: lines[line - 1].length,
          lines,
        });
      }

      return context;
    },
    PREV_WORD: (_, context): Transition => {
      const { lines, char, line, lastPositioning } = context;

      if (Date.now() - lastPositioning < 150) {
        return changePosition(context, {
          lines,
          line,
          char: 0,
        });
      }

      let newChar = char - 2;

      for (newChar; newChar > 0; newChar--) {
        if (lines[line][newChar + 1] === " ") {
          newChar++;
          break;
        }
      }

      return changePosition(context, {
        lines,
        line,
        char: Math.max(newChar, 0),
      });
    },
    NEXT_WORD: (_, context): Transition => {
      const { char, lines, line, lastPositioning } = context;

      if (Date.now() - lastPositioning < 150) {
        return changePosition(context, {
          lines,
          line,
          char: lines[line].length,
        });
      }

      let newChar = char + 1;

      for (newChar; newChar < lines[line].length; newChar++) {
        if (lines[line][newChar] === " ") {
          break;
        }
      }

      return changePosition(context, {
        lines,
        line,
        char: Math.min(newChar, lines[line].length),
      });
    },
    NEXT_PARAGRAPH: (_, context): Transition => {
      const { line, lines, lastPositioning } = context;

      if (Date.now() - lastPositioning < 150) {
        return changePosition(context, {
          lines,
          line: lines.length - 1,
          char: 0,
        });
      }

      let newLine = line + 1;

      for (newLine; newLine < lines.length; newLine++) {
        if (lines[newLine] === "") {
          newLine++;
          break;
        }
      }

      newLine = Math.min(newLine, lines.length - 1);

      return changePosition(context, {
        lines,
        line: newLine,
        char: 0,
      });
    },
    PREV_PARAGRAPH: (_, context): Transition => {
      const { lines, line, lastPositioning } = context;

      if (Date.now() - lastPositioning < 150) {
        return changePosition(context, {
          lines,
          line: 0,
          char: 0,
        });
      }

      let newLine = line - 1;

      for (newLine; newLine > 0; newLine--) {
        if (lines[newLine - 1] === "") {
          break;
        }
      }

      newLine = Math.max(newLine, 0);

      return changePosition(context, {
        lines,
        line: newLine,
        char: 0,
      });
    },
  },
});

export default function Editor({
  value = "",
  caret = {
    line: 0,
    char: 0,
  },
  height = 500,
  onChange,
  onCaretChange,
}: {
  height: number;
  value: string;
  caret: {
    line: number;
    char: number;
  };
  onChange: (value: string) => void;
  onCaretChange: (position: { line: number; char: number }) => void;
}) {
  const width = LINE_LENGTH * FONT_SIZE;
  const [canvas, ctx] = useCanvas(width, height);
  const [context, send] = useReducer(reducer, {
    state: "IDLE",
    lines: value.split("\n"),
    line: caret.line,
    char: caret.char,
    lastPositioning: Date.now(),
  });

  function drawLine(line: number, text: string) {
    ctx.clearRect(PADDING, line * LINE_HEIGHT, width, LINE_HEIGHT);
    ctx.fillText(text, PADDING, (line + 1) * LINE_HEIGHT);
  }

  function drawLines(lines: string[], currentLine: number) {
    ctx.clearRect(PADDING, currentLine * LINE_HEIGHT, width, height);

    for (let line = currentLine; line < lines.length; line++) {
      const text = lines[line];
      ctx.fillText(text, PADDING, (line + 1) * LINE_HEIGHT);
    }
  }

  function drawCaret(line: number, char: number, text: string) {
    ctx.fillRect(
      PADDING + ctx.measureText(text.slice(0, char)).width,
      line * LINE_HEIGHT + LINE_HEIGHT / 2,
      1,
      LINE_HEIGHT / 2
    );
  }

  useEffect(() => {
    if (ctx) {
      ctx.font = `${FONT_SIZE}px monospace`;
      ctx.fillStyle = "#EAEAEA";
      ctx.textBaseline = "bottom";

      drawLines(context.lines, 0);
      drawCaret(caret.line, caret.char, context.lines[caret.line]);
    }
  }, [ctx]);

  useEnterEffect(context, "IDLE", () => {
    const keydown = (event: KeyboardEvent) => {
      const key = event.code === "Equal" ? "`" : event.key;

      if (!event.metaKey && key.length === 1) {
        event.preventDefault();
        send({
          type: "CHAR_INSERT",
          key: key,
        });
      } else if (key === "Backspace") {
        event.preventDefault();
        send({
          type: "CHAR_REMOVE",
        });
      } else if (key === "Enter") {
        event.preventDefault();
        send({
          type: "NEW_LINE",
        });
      } else if (key === "ArrowUp") {
        event.preventDefault();
        send({
          type: event.metaKey ? "PREV_PARAGRAPH" : "PREV_LINE",
        });
      } else if (key === "ArrowDown") {
        event.preventDefault();
        send({
          type: event.metaKey ? "NEXT_PARAGRAPH" : "NEXT_LINE",
        });
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        send({
          type: event.metaKey ? "PREV_WORD" : "PREV_CHAR",
        });
      } else if (key === "ArrowRight") {
        event.preventDefault();
        send({
          type: event.metaKey ? "NEXT_WORD" : "NEXT_CHAR",
        });
      }
    };

    document.addEventListener("keydown", keydown);

    return () => {
      document.removeEventListener("keydown", keydown);
    };
  });

  useTransientEffect(context, "$INSERTING", ({ line, lines, char }) => {
    drawLine(line, lines[line]);
    drawCaret(line, char, lines[line]);
    onCaretChange({ line, char });
    onChange(lines.join("\n"));
  });

  useTransientEffect(context, "$REMOVING", ({ line, lines, char }) => {
    drawLine(line, lines[line]);
    drawCaret(line, char, lines[line]);
    onCaretChange({ line, char });
    onChange(lines.join("\n"));
  });

  useTransientEffect(
    context,
    "$CHANGING_POSITION",
    ({ lines, prevLines, prevLine, line, char }) => {
      drawLines(lines, Math.min(prevLine, line));
      drawCaret(line, char, lines[line]);
      onCaretChange({ line, char });

      if (lines !== prevLines) {
        onChange(lines.join("\n"));
      }
    }
  );

  return canvas;
}
