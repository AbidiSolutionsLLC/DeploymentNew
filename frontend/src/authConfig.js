import { LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: "574e37f1-c661-4ff5-bc60-0cd610a26663",
    authority: "https://login.microsoftonline.com/8d796e08-17e8-40d3-99d2-af2319d5dfd8",
    redirectUri: window.location.origin, // This should be your app URL
    postLogoutRedirectUri: window.location.origin,
    navigateToLoginRequestUrl: true, // Changed to true
  },
  cache: {
    cacheLocation: "localStorage", 
    storeAuthStateInCookie: false, 
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) {
          return;
        }
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
          default:
            return;
        }
      }
    }
  }
};

export const loginRequest = {
  scopes: ["api://574e37f1-c661-4ff5-bc60-0cd610a26663/Abidi-Pro"]
};