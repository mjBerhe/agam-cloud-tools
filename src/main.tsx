import React from "react";
import ReactDOM from "react-dom/client";
import { useRouteError } from "react-router-dom";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Root from "./roots/root";
import "./App.css";

export const ErrorPage: React.FC = () => {
  const error = useRouteError();
  console.error(error);

  return (
    <div>
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
    </div>
  );
};

// Global Config Loader Component if we want to load in any state
const AppWithConfig: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    errorElement: <ErrorPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AppWithConfig>
      <RouterProvider router={router} />
    </AppWithConfig>
  </React.StrictMode>
);
