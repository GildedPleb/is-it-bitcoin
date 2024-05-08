import "./index.css";

// eslint-disable-next-line unicorn/prefer-node-protocol, node/prefer-global/buffer
import { Buffer } from "buffer";
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./app";
window.Buffer = Buffer;

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
