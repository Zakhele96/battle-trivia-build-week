import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { MentionProvider } from "./context/MentionContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MentionProvider>
          <App />
        </MentionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);