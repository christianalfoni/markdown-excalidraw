import { BookOpenIcon } from "@heroicons/react/outline";
import React from "react";
import { match } from "react-states";
import { useProject } from "../features/project";
import { useSession } from "../features/session";
import { AppContent } from "./AppContent";
import { AppWrapper } from "./AppWrapper";
import { Book } from "./Book";
import { EditBook } from "./EditBook";
import { GitChanges } from "./GitChanges";
import { Navigation } from "./Navigation";
import { Toc } from "./Toc";

export const App = () => {
  const [project, send] = useProject();
  const [session] = useSession();

  const loading = (
    <div className="w-screen h-screen text-gray-100 flex items-center justify-center flex-col">
      <BookOpenIcon className="w-10 h-10" />
      <span>opening</span>
    </div>
  );

  return (
    <AppWrapper>
      {match(project, {
        LOADING_PROJECT: () => loading,
        READY: (readyContext) => (
          <>
            <Toc />
            <AppContent>
              <Navigation project={readyContext} send={send} />
              <div className="mx-auto flex items-center">
                {match(session, {
                  AUTHENTICATING: () => loading,
                  SIGNED_IN: () => <EditBook />,
                  SIGNED_OUT: () => <Book />,
                  SIGNING_IN: () => loading,
                })}
              </div>
            </AppContent>
            <GitChanges project={readyContext} send={send} />
          </>
        ),
      })}
    </AppWrapper>
  );
};
