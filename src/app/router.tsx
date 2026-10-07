import { createBrowserRouter } from "react-router";
import { routesForHost } from "./routes";

export const router = createBrowserRouter(routesForHost(globalThis.location.host));
