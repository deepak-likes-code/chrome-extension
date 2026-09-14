import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import SidePanelApp from "./components/sidepanel/SidePanelApp";

const root = document.getElementById("root");
if (root) createRoot(root).render(<SidePanelApp />);
