/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as lib from "../lib.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  lib: typeof lib;
}>;
export type Mounts = {
  lib: {
    addChunk: FunctionReference<
      "mutation",
      "public",
      { final: boolean; streamId: string; text: string },
      any
    >;
    createStream: FunctionReference<"mutation", "public", {}, any>;
    getStreamStatus: FunctionReference<
      "query",
      "public",
      { streamId: string },
      "pending" | "streaming" | "done" | "error" | "timeout"
    >;
    getStreamText: FunctionReference<
      "query",
      "public",
      { streamId: string },
      {
        status: "pending" | "streaming" | "done" | "error" | "timeout";
        text: string;
      }
    >;
    setStreamStatus: FunctionReference<
      "mutation",
      "public",
      {
        status: "pending" | "streaming" | "done" | "error" | "timeout";
        streamId: string;
      },
      any
    >;
  };
};
// For now fullApiWithMounts is only fullApi which provides
// jump-to-definition in component client code.
// Use Mounts for the same type without the inference.
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
