import React, { Dispatch } from "react";
import { match, PickState } from "react-states";
import { GitStatus } from "../environments/project";
import { WriteBookState, WriteBookAction } from "../features/writeBook";
import { classNames } from "../utils";

const renderGitStatusLabel = (status: GitStatus) => {
  switch (status) {
    case "ADD_UNSTAGED":
    case "ADD_PARTIALLY_STAGED":
    case "ADD_STAGED": {
      return (
        <span className="p-1 rounded bg-green-500 text-green-50 text-xs mr-1">
          add
        </span>
      );
    }
    case "MODIFIED_UNSTAGED":
    case "MODIFIED_STAGED":
    case "MODIFIED_PARTIALLY_STAGED": {
      return (
        <span className="p-1 rounded bg-yellow-500 text-yellow-50 text-xs mr-1">
          modify
        </span>
      );
    }
    case "DELETED_UNSTAGED":
    case "DELETED_STAGED": {
      return (
        <span className="p-1 rounded bg-red-500 text-red-50 text-xs mr-1">
          delete
        </span>
      );
    }
  }
};

export const GitChanges = ({
  book,
  send,
}: {
  book: PickState<WriteBookState, "READY" | "SAVING" | "UPDATING">;
  send: Dispatch<WriteBookAction>;
}) => {
  return (
    <div
      className={classNames(
        "p-4 absolute top-0 h-screen transition-all ease-in-out w-72",
        match(book.menu, {
          TOC: () => "-right-72 duration-300",
          IDLE: () => "-right-72 duration-300",
          GIT: () => "right-0 duration-500",
        })
      )}
    >
      <ul>
        {book.changes.map(({ path, status }) => (
          <li key={path} className="text-gray-500 mb-2 flex items-center">
            {renderGitStatusLabel(status)}
            {path}
          </li>
        ))}
      </ul>
      <button
        onClick={() => {
          send({
            type: "SAVE",
          });
        }}
        disabled={match(book, {
          READY: () => !book.changes.length,
          SAVING: () => true,
          UPDATING: () => true,
        })}
        className={classNames(
          match(book, {
            READY: () =>
              book.changes.length
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "text-gray-600",
            SAVING: () => "text-gray-600",
            UPDATING: () => "text-gray-600",
          }),
          "w-full p-2 rounded-md mt-2 text-sm"
        )}
      >
        Save
      </button>
      <button
        onClick={() => {
          send({
            type: "UPDATE",
          });
        }}
        disabled={match(book.version, {
          UP_TO_DATE: () => true,
          BEHIND: () => false,
        })}
        className={classNames(
          match(book, {
            READY: () =>
              match(book.version, {
                UP_TO_DATE: () => "text-gray-600",
                BEHIND: () => "bg-gray-800 text-gray-300 hover:bg-gray-700",
              }),
            SAVING: () => "text-gray-600",
            UPDATING: () => "text-gray-600",
          }),
          "w-full p-2 rounded-md mt-2 text-sm"
        )}
      >
        Update
      </button>
    </div>
  );
};
