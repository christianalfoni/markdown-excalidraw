import dynamic from "next/dynamic";
import React from "react";
import { DevtoolsProvider } from "react-states/devtools";
import { SessionFeature } from "../features/session";
import { App } from "../components/App";

const Environment = process.browser
  ? dynamic(() => import("../environments/browser"), { ssr: false })
  : dynamic(() => import("../environments/next"));

export default function Home() {
  const children = (
    <SessionFeature>
      <App />
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
