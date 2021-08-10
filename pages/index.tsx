import dynamic from "next/dynamic";
import React from "react";
import { ProjectFeature } from "../features/project";
import { DevtoolsProvider } from "react-states/devtools";
import { useRouter } from "next/router";
import { SnippetsFeature } from "../features/snippets";
import { SessionFeature } from "../features/session";
import { App } from "../components/App";

const Environment = process.browser
  ? dynamic(() => import("../environments/browser"), { ssr: false })
  : dynamic(() => import("../environments/next"));

export default function Home() {
  const router = useRouter();
  const repoUrl = "https://github.com/christianalfoni/test-book";
  const children = (
    <SessionFeature>
      <ProjectFeature
        repoUrl={repoUrl}
        page={router.query.page ? Number(router.query.page) : 0}
      >
        <SnippetsFeature repoUrl={repoUrl}>
          <App />
        </SnippetsFeature>
      </ProjectFeature>
    </SessionFeature>
  );

  return (
    <Environment>
      {process.env.NODE_ENV === "production" ? (
        children
      ) : (
        <DevtoolsProvider>{children}</DevtoolsProvider>
      )}
    </Environment>
  );
}
