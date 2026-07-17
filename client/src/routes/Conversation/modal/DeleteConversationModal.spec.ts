import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeleteConversationModal from "./DeleteConversationModal";

let mutationOptions: { onSuccess: (value: boolean) => void };
const mutate = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useMutation: (options: { onSuccess: (value: boolean) => void }) => {
    mutationOptions = options;
    return { isPending: false, mutate };
  },
}));

vi.mock("src/components/Modal", () => ({
  Modal: ({ children, title }: { children: React.ReactNode; title: string }) =>
    React.createElement("section", null, React.createElement("h2", null, title), children),
}));

describe("DeleteConversationModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a clear confirmation with the conversation title", () => {
    const html = renderToStaticMarkup(
      React.createElement(DeleteConversationModal, {
        conversationId: 1,
        conversationTitle: "Project plan",
        onCancelRemove: vi.fn(),
        onConfirmRemove: vi.fn(),
      }),
    );

    expect(html).toContain("Delete conversation");
    expect(html).toContain("Project plan");
    expect(html).toContain("Are you sure");
  });

  it("wires mutation success to the confirmation callback", () => {
    const onConfirmRemove = vi.fn();
    renderToStaticMarkup(
      React.createElement(DeleteConversationModal, {
        conversationId: 1,
        onCancelRemove: vi.fn(),
        onConfirmRemove,
      }),
    );

    mutationOptions.onSuccess(true);

    expect(onConfirmRemove).toHaveBeenCalledWith(true);
  });
});
