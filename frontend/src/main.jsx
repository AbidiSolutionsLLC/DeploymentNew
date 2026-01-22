import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext";
import { BrowserRouter as Router } from "react-router-dom";
import { Provider } from "react-redux";
import { store, persistor } from "./Store/index";
import { TimeLogProvider } from "./Pages/People/TimeLogContext";
import { PersistGate } from "redux-persist/integration/react";
import { injectStore } from "./axios";

// MSAL Imports
import { PublicClientApplication, EventType } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from "./authConfig";

const msalInstance = new PublicClientApplication(msalConfig);

// Initialize and handle redirect
msalInstance.initialize().then(() => {
  // Handle redirect promise BEFORE rendering
  msalInstance.handleRedirectPromise()
    .then((response) => {
      if (response) {
        console.log("Redirect response received:", response);
        msalInstance.setActiveAccount(response.account);
      } else {
        // Set active account if already logged in
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          msalInstance.setActiveAccount(accounts[0]);
        }
      }
    })
    .catch((error) => {
      console.error("Redirect error:", error);
    })
    .finally(() => {
      // NOW render the app
      renderApp();
    });
});

// Listen for sign-in events
msalInstance.addEventCallback((event) => {
  console.log("MSAL Event:", event.eventType);
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload.account) {
    const account = event.payload.account;
    msalInstance.setActiveAccount(account);
    console.log("Active account set:", account);
  }
});

injectStore(store);

const root = ReactDOM.createRoot(document.getElementById("root"));

function renderApp() {
  root.render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <Router>
          <ThemeProvider>
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor}>
                <TimeLogProvider>
                  <App />
                </TimeLogProvider>
              </PersistGate>
            </Provider>
          </ThemeProvider>
        </Router>
      </MsalProvider>
    </React.StrictMode>
  );
}