import { match } from "react-states";
import { useWriteBook } from "../features/writeBook";
import { Loading } from "./Loading";
import { ExcalidrawsProvider } from "./ExcalidrawsProvider";
import { Toc } from "./Toc";
import { AppContent } from "./AppContent";

import { Pages } from "./Pages";
import { MenuAlt2Icon } from "@heroicons/react/outline";
import { LoginIcon } from "@heroicons/react/outline";
import { useSession } from "../features/session";

export const ReadBook = () => {
  const [book, send] = useWriteBook();
  const [_, sendSession] = useSession();

  return match(book, {
    LOADING_PROJECT: () => <Loading />,
    READY: (readyContext) => (
      <ExcalidrawsProvider excalidraws={readyContext.excalidraws}>
        <Toc />
        <AppContent>
          <MenuAlt2Icon
            onClick={() => {
              send({
                type: "TOGGLE_TOC",
              });
            }}
            className="w-6 h-6 text-gray-100 0 absolute top-4 left-4"
          />
          <LoginIcon
            onClick={() => {
              sendSession({
                type: "SIGN_IN",
              });
            }}
            className="w-6 h-6 text-gray-100 absolute top-4 right-4"
          />
          <div className="mx-auto flex items-center">
            <Pages pages={readyContext.pages} />
          </div>
        </AppContent>
      </ExcalidrawsProvider>
    ),
  });
};
