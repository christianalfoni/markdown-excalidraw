import { useRouter } from "next/router";
import React from "react";
import { match } from "react-states";
import { WriteBookFeature } from "../features/writeBook";
import { useSession } from "../features/session";
import { SnippetsFeature } from "../features/snippets";
import { AppWrapper } from "./AppWrapper";
import { WriteBook } from "./WriteBook";
import { Loading } from "./Loading";
import { ReadBook } from "./ReadBook";
import { ReadBookFeature } from "../features/readBook";

export const App = () => {
  const [session] = useSession();
  const router = useRouter();
  const repoUrl = "https://github.com/christianalfoni/test-book";
  const page = router.query.page ? Number(router.query.page) : 0;

  return (
    <AppWrapper>
      {match(session, {
        AUTHENTICATING: () => <Loading />,
        SIGNED_IN: ({ accessToken }) => (
          <WriteBookFeature
            repoUrl={repoUrl}
            accessToken={accessToken}
            page={page}
          >
            <SnippetsFeature repoUrl={repoUrl}>
              <WriteBook />
            </SnippetsFeature>
          </WriteBookFeature>
        ),
        SIGNED_OUT: () => (
          <ReadBookFeature repoUrl={repoUrl} page={page}>
            <SnippetsFeature repoUrl={repoUrl}>
              <ReadBook />
            </SnippetsFeature>
          </ReadBookFeature>
        ),
        SIGNING_IN: () => <Loading />,
      })}
    </AppWrapper>
  );
};
