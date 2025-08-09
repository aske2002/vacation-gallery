import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import "./index.css";
import { APIProvider } from "@vis.gl/react-google-maps";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { DefaultLoader } from "./components/default-loader";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./hooks/useVacationAuth";
import "leaflet/dist/leaflet.css";
import "./components/osm/zoom-controller"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
  },
});

// Create a new router instance
const router = createRouter({
  routeTree,
  defaultPendingComponent: DefaultLoader,
  defaultPendingMs: 0,
  context: {
    queryClient,
  },
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <APIProvider
        apiKey="AIzaSyC-vaTZTfS6CPY9bf9fugOEUAChgFLaVC0"
        onError={() => {}}
      >
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
            <Toaster />
          </AuthProvider>
        </QueryClientProvider>
      </APIProvider>
    </StrictMode>
  );
}
