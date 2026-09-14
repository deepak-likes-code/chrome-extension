import React from "react";
import ReactDOM from "react-dom/client";
import MacOSLayout from "./components/Layout";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode><MacOSLayout /></React.StrictMode>
);
