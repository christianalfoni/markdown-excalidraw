import { match } from "react-states";
import { Loading } from "./Loading";
import { ExcalidrawsProvider } from "./ExcalidrawsProvider";
import { TocList } from "./TocList";

import { Pages } from "./Pages";
import { MenuAlt2Icon } from "@heroicons/react/outline";
import { LoginIcon } from "@heroicons/react/outline";
import { useSession } from "../features/session";
import { useReadBook } from "../features/readBook";
import { classNames } from "../utils";

export const ReadBook = () => {
  const [book, send] = useReadBook();
  const [_, sendSession] = useSession();

  return match(book, {
    LOADING_PROJECT: () => <Loading />,
    READY: ({ excalidraws, pages, pageIndex }) => (
      <ExcalidrawsProvider excalidraws={excalidraws}>
        <div
          className={classNames(
            "p-4 absolute top-0 min-h-screen transition-all ease-in-out",
            match(book.menu, {
              TOC: () => "left-0 duration-500",
              IDLE: () => "-left-72 duration-300",
            })
          )}
        >
          <TocList pages={pages} pageIndex={pageIndex} />
        </div>
        <div
          className={classNames(
            "absolute top-0 min-h-screen w-screen flex font-serif font-normal text-gray-600 mx-auto transition-all ease-in-out duration-300",
            match(book.menu, {
              TOC: () => "left-72",
              IDLE: () => "left-0",
            })
          )}
        >
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
            <Pages pages={pages} />
          </div>
        </div>
      </ExcalidrawsProvider>
    ),
  });
};
