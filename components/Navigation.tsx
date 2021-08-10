import {
  DatabaseIcon,
  LoginIcon,
  LogoutIcon,
  MenuAlt2Icon,
} from "@heroicons/react/outline";
import React, { Dispatch } from "react";
import { match, PickContext } from "react-states";
import { ProjectContext, ProjectEvent } from "../features/project";
import { useSession } from "../features/session";

export const Navigation = ({
  project,
  send,
}: {
  project: PickContext<ProjectContext, "READY">;
  send: Dispatch<ProjectEvent>;
}) => {
  const [session, sendSession] = useSession();
  const { menu } = project;

  return (
    <>
      <MenuAlt2Icon
        onClick={() => {
          send({
            type: "TOGGLE_TOC",
          });
        }}
        className="w-6 h-6 text-gray-100 0 absolute top-4 left-4"
      />
      {match(session, {
        AUTHENTICATING: () => (
          <LoginIcon className="w-6 h-6 text-gray-500 absolute top-4 right-4" />
        ),
        SIGNED_IN: () => (
          <>
            <DatabaseIcon
              onClick={() => {
                send({ type: "TOGGLE_GIT" });
              }}
              className="w-6 h-6 text-gray-100 absolute top-4 right-4"
            />
            {project.changes.length ? (
              <span className="bg-red-500 w-3 h-3 top-3 right-4 rounded-full absolute border-2 border-gray-900" />
            ) : null}
          </>
        ),
        SIGNED_OUT: () => (
          <LoginIcon
            onClick={() => {
              sendSession({
                type: "SIGN_IN",
              });
            }}
            className="w-6 h-6 text-gray-100 absolute top-4 right-4"
          />
        ),
        SIGNING_IN: () => (
          <LogoutIcon className="w-6 h-6 text-gray-500 absolute top-4 right-4" />
        ),
      })}
    </>
  );
};
