import React from "react";
import ReactDOM from "react-dom/client";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import MacOSLayout from "./components/Layout";
import "./index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <DndProvider backend={HTML5Backend}>
      <MacOSLayout />
    </DndProvider>
  </React.StrictMode>
);
