import React from "react";
import { createRoot } from "react-dom/client";
import Dashboard from "./Dashboard";
import "../../index.css";

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <Dashboard />
  </React.StrictMode>,
);
