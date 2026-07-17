import React from "react";
import { Show } from "src/components/Condition";
import { ChatIcon, CloseIcon, TrashIcon } from "./Icons";
import { Conversation } from "src/models";

interface Props {
  conversations: Conversation[];
  selectedId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: VoidFunction;
  onRemoveConversation: (id: number) => void;
  isLoading: boolean;
  isError: boolean;
  isOpen: boolean;
  onClose: VoidFunction;
}

const SideBar = ({
  conversations,
  selectedId,
  onSelectConversation,
  onNewConversation,
  onRemoveConversation,
  isLoading,
  isError,
  isOpen,
  onClose,
}: Props) => {
  return (
    <aside
      aria-label="Conversation history"
      className={`absolute inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col border-r border-slate-200 bg-slate-50 shadow-xl transition-[transform,visibility] duration-200 md:visible md:static md:w-72 md:translate-x-0 md:shadow-none ${isOpen ? "visible translate-x-0" : "invisible -translate-x-full"}`}
    >
      <div className="border-b border-slate-200 p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 px-2 py-2 font-bold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm text-white">
              AI
            </span>
            Conversations
          </div>
          <button
            aria-label="Close conversation menu"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-ink-600 hover:bg-slate-200 md:hidden"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>
        <button
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink-900 hover:bg-slate-100"
          onClick={() => {
            onNewConversation();
            onClose();
          }}
          type="button"
        >
          New conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Recent
        </p>
        <Show when={isLoading}>
          <p className="px-3 py-4 text-sm text-ink-600">
            Loading conversations...
          </p>
        </Show>
        <Show when={isError}>
          <p className="px-3 py-4 text-sm text-rose-600">
            Could not load conversations.
          </p>
        </Show>
        <Show when={!isLoading && !isError && conversations.length === 0}>
          <p className="px-3 py-4 text-sm text-ink-600">
            No conversations yet.
          </p>
        </Show>
        <ul className="grid gap-1">
          {conversations.map((conversation) => (
            <li key={conversation.id}>
              <div
                className={`group flex items-center rounded-lg transition ${selectedId === conversation.id ? "bg-primary-50 text-primary-700" : "text-ink-900 hover:bg-slate-200/70"}`}
              >
                <button
                  className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-3 text-left text-sm ${selectedId === conversation.id ? "font-semibold" : ""}`}
                  onClick={() => {
                    onSelectConversation(conversation.id);
                    onClose();
                  }}
                >
                  <span className="shrink-0 text-ink-600">
                    <ChatIcon />
                  </span>
                  <span className="truncate">
                    {conversation.title || "Untitled conversation"}
                  </span>
                </button>
                <button
                  aria-label={`Delete ${conversation.title || "untitled conversation"}`}
                  className="mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-ink-600 opacity-70 transition hover:bg-rose-50 hover:text-rose-700 focus:opacity-100 group-hover:opacity-100"
                  onClick={() => onRemoveConversation(conversation.id)}
                  title="Delete conversation"
                  type="button"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default SideBar;
