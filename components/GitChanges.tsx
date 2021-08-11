import React, { Dispatch } from "react";
import { match, PickContext } from "react-states";
import { GitStatus } from "../environments/project";
import { WriteBookContext, WriteBookEvent } from "../features/writeBook";
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
}: {
  book: PickContext<WriteBookContext, "READY">;
}) => {
  return (
    <div
      className={classNames(
        "p-4 absolute top-0 min-h-screen transition-all ease-in-out w-72",
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
      <button className="text-gray-300 w-full p-2 bg-gray-800 rounded-md mt-2 text-sm">
        Save
      </button>
    </div>
  );
};
