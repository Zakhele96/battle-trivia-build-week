import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { AlertsProvider } from "./context/AlertsContext";
import { DirectMessagesProvider } from "./context/DirectMessagesContext";
import { MentionProvider } from "./context/MentionContext";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AlertsProvider>
            <DirectMessagesProvider>
              <MentionProvider>
                <App />
              </MentionProvider>
            </DirectMessagesProvider>
          </AlertsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
