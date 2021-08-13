import { useEffect, useReducer } from "react";
import {
  StateTransition,
  Transitions,
  useCommandEffect,
  useStateEffect,
  useStates,
} from "react-states";

import { useCanvas } from "./useCanvas";

const LINE_HEIGHT = 30;
const PADDING = 10;
const LINE_LENGTH = 75;
const FONT_SIZE = 16;

type State = {
  context: "IDLE";
  lines: string[];
  line: number;
  char: number;
  lastPositioning: number;
};

type Command =
  | {
      cmd: "INSERT";
      key: string;
      line: number;
      lines: string[];
      char: number;
    }
  | {
      cmd: "REMOVE";
      line: number;
      lines: string[];
      char: number;
    }
  | {
      cmd: "CHANGE_POSITION";
      lines: string[];
      prevLines: string[];
      prevLine: number;
      line: number;
      char: number;
    };

type Action =
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

type Transition = StateTransition<State, Command>;

const changePosition = (
  state: State,
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
      ...state,
      line,
      lines,
      char,
      lastPositioning: Date.now(),
    },
    {
      cmd: "CHANGE_POSITION",
      char,
      line,
      lines,
      prevLine: state.line,
      prevLines: state.lines,
    },
  ];
};

const transitions: Transitions<State, Action, Command> = {
  IDLE: {
    CHAR_INSERT: ({ key }, state): Transition => {
      const { lines, line, char } = state;

      if (lines[line].length === LINE_LENGTH) {
        const currentWords = lines[line].split(" ");
        const lastWord = currentWords.pop() || "";

        return changePosition(state, {
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
          ...state,
          lines: newLines,
          char: newChar,
        },
        {
          cmd: "INSERT",
          key,
          line,
          lines: newLines,
          char: newChar,
        },
      ];
    },

    CHAR_REMOVE: (_, state): Transition => {
      const { lines, line, char } = state;

      if (char === 0 && line === 0) {
        return state;
      }

      if (char === 0) {
        return changePosition(state, {
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
          ...state,
          lines: newLines,
          char: newChar,
        },
        {
          cmd: "REMOVE",
          line,
          lines: newLines,
          char: newChar,
        },
      ];
    },
    NEW_LINE: (_, state): Transition => {
      const { line, lines } = state;

      return changePosition(state, {
        line: line + 1,
        char: 0,
        lines: [...lines.slice(0, line + 1), "", ...lines.slice(line + 1)],
      });
    },
    NEXT_LINE: (_, state): Transition => {
      if (state.line + 1 >= state.lines.length) {
        return state;
      }

      return changePosition(state, {
        line: state.line + 1,
        char: Math.min(state.lines[state.line + 1].length, state.char),
        lines: state.lines,
      });
    },
    PREV_LINE: (_, state): Transition => {
      if (state.line - 1 < 0) {
        return state;
      }

      return changePosition(state, {
        line: state.line - 1,
        char: Math.min(state.lines[state.line - 1].length, state.char),
        lines: state.lines,
      });
    },
    NEXT_CHAR: (_, state): Transition => {
      const { char, lines, line } = state;
      if (char < lines[line].length) {
        return changePosition(state, {
          line: state.line,
          char: char + 1,
          lines: state.lines,
        });
      } else if (line + 1 < lines.length) {
        return changePosition(state, {
          line: line + 1,
          char: 0,
          lines: state.lines,
        });
      }

      return state;
    },
    PREV_CHAR: (_, state): Transition => {
      const { char, lines, line } = state;
      if (char > 0) {
        return changePosition(state, {
          line,
          char: char - 1,
          lines,
        });
      } else if (line > 0) {
        return changePosition(state, {
          line: line - 1,
          char: lines[line - 1].length,
          lines,
        });
      }

      return state;
    },
    PREV_WORD: (_, state): Transition => {
      const { lines, char, line, lastPositioning } = state;

      if (Date.now() - lastPositioning < 150) {
        return changePosition(state, {
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

      return changePosition(state, {
        lines,
        line,
        char: Math.max(newChar, 0),
      });
    },
    NEXT_WORD: (_, state): Transition => {
      const { char, lines, line, lastPositioning } = state;

      if (Date.now() - lastPositioning < 150) {
        return changePosition(state, {
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

      return changePosition(state, {
        lines,
        line,
        char: Math.min(newChar, lines[line].length),
      });
    },
    NEXT_PARAGRAPH: (_, state): Transition => {
      const { line, lines, lastPositioning } = state;

      if (Date.now() - lastPositioning < 150) {
        return changePosition(state, {
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

      return changePosition(state, {
        lines,
        line: newLine,
        char: 0,
      });
    },
    PREV_PARAGRAPH: (_, state): Transition => {
      const { lines, line, lastPositioning } = state;

      if (Date.now() - lastPositioning < 150) {
        return changePosition(state, {
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

      return changePosition(state, {
        lines,
        line: newLine,
        char: 0,
      });
    },
  },
};

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
  const [state, dispatch] = useStates<State, Action, Command>(
    {
      context: "IDLE",
      lines: value.split("\n"),
      line: caret.line,
      char: caret.char,
      lastPositioning: Date.now(),
    },
    transitions
  );

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

      drawLines(state.lines, 0);
      drawCaret(caret.line, caret.char, state.lines[caret.line]);
    }
  }, [ctx]);

  useStateEffect(state, "IDLE", () => {
    const keydown = (event: KeyboardEvent) => {
      const key = event.code === "Equal" ? "`" : event.key;

      if (!event.metaKey && key.length === 1) {
        event.preventDefault();
        dispatch({
          type: "CHAR_INSERT",
          key: key,
        });
      } else if (key === "Backspace") {
        event.preventDefault();
        dispatch({
          type: "CHAR_REMOVE",
        });
      } else if (key === "Enter") {
        event.preventDefault();
        dispatch({
          type: "NEW_LINE",
        });
      } else if (key === "ArrowUp") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "PREV_PARAGRAPH" : "PREV_LINE",
        });
      } else if (key === "ArrowDown") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "NEXT_PARAGRAPH" : "NEXT_LINE",
        });
      } else if (key === "ArrowLeft") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "PREV_WORD" : "PREV_CHAR",
        });
      } else if (key === "ArrowRight") {
        event.preventDefault();
        dispatch({
          type: event.metaKey ? "NEXT_WORD" : "NEXT_CHAR",
        });
      }
    };

    document.addEventListener("keydown", keydown);

    return () => {
      document.removeEventListener("keydown", keydown);
    };
  });

  useCommandEffect(state, "INSERT", ({ line, lines, char }) => {
    drawLine(line, lines[line]);
    drawCaret(line, char, lines[line]);
    onCaretChange({ line, char });
    onChange(lines.join("\n"));
  });

  useCommandEffect(state, "REMOVE", ({ line, lines, char }) => {
    drawLine(line, lines[line]);
    drawCaret(line, char, lines[line]);
    onCaretChange({ line, char });
    onChange(lines.join("\n"));
  });

  useCommandEffect(
    state,
    "CHANGE_POSITION",
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
