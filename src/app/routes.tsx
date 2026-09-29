import type { RouteObject } from "react-router";
import { AppErrorPage } from "@/layouts/AppErrorBoundary";

export const routes: RouteObject[] = [{ path: "/", element: <main />, errorElement: <AppErrorPage /> }];
