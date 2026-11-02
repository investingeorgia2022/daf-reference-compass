import { describe, expect, it } from "vitest";
import { modelChain } from "@/server/geminiRouter";

const auto = { mode: "auto" as const, fixedModel: "gemini-flash-latest", complexModel: "" };

describe("gemini model router", () => {
  it("routes quick word lookups to Flash-Lite, then falls back to Flash", () => {
    expect(modelChain(auto, "lite")).toEqual(["gemini-flash-lite-latest", "gemini-flash-latest"]);
  });
  it("routes deep commentary analysis to Pro with Flash fallback", () => {
    expect(modelChain(auto, "deep")).toEqual(["gemini-pro-latest", "gemini-flash-latest", "gemini-flash-lite-latest"]);
  });
  it("uses the user's complex model (e.g. Argon) for complex tasks", () => {
    expect(modelChain({ ...auto, complexModel: "argon-x" }, "complex")).toEqual(["argon-x", "gemini-flash-latest", "gemini-flash-lite-latest"]);
  });
  it("fixed mode uses the chosen model for every task", () => {
    expect(modelChain({ ...auto, mode: "fixed", fixedModel: "gemini-pro-latest" }, "lite")[0]).toBe("gemini-pro-latest");
  });
});
