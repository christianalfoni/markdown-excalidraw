import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import { match } from "react-states";
import { WriteBookFeature } from "../features/writeBook";
import { useSession } from "../features/session";
import { SnippetsFeature } from "../features/snippets";
import { AppWrapper } from "./AppWrapper";
import { WriteBook } from "./WriteBook";
import { Loading } from "./Loading";
import { ReadBook } from "./ReadBook";
import { ReadBookFeature } from "../features/readBook";
import { SandboxesFeature } from "../features/sandboxes";
import FontFaceObserver from "fontfaceobserver";

const inter400 = new FontFaceObserver("Inter", {
  weight: 400,
});

const inter500 = new FontFaceObserver("Inter", {
  weight: 500,
});

export const App = () => {
  const [session] = useSession();
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const router = useRouter();
  const repoUrl = "https://github.com/christianalfoni/react-states";
  const branch = "next";
  const chapter = router.query.chapter ? Number(router.query.chapter) : 0;

  useEffect(() => {
    Promise.all([inter400.load(), inter500.load()]).then(() => {
      setFontsLoaded(true);
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <AppWrapper>
        <Loading />
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      {match(session, {
        AUTHENTICATING: () => <Loading />,
        SIGNED_IN: ({ accessToken }) => (
          <WriteBookFeature
            repoUrl={repoUrl}
            branch={branch}
            accessToken={accessToken}
            chapter={chapter}
          >
            <SnippetsFeature repoUrl={repoUrl}>
              <SandboxesFeature repoUrl={repoUrl}>
                <WriteBook />
              </SandboxesFeature>
            </SnippetsFeature>
          </WriteBookFeature>
        ),
        SIGNED_OUT: () => (
          <ReadBookFeature repoUrl={repoUrl} branch={branch} chapter={chapter}>
            <SnippetsFeature repoUrl={repoUrl}>
              <SandboxesFeature repoUrl={repoUrl}>
                <ReadBook />
              </SandboxesFeature>
            </SnippetsFeature>
          </ReadBookFeature>
        ),
        SIGNING_IN: () => <Loading />,
      })}
    </AppWrapper>
  );
};
