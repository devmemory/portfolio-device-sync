import React, { FormEvent, useState } from "react";
import { ConversationContent } from "src/models";
import useConversationController from "./useConversationController";

const MenuIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const ChatIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v8Z" />
  </svg>
);

const SendIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m5 12 7-7 7 7M12 19V5" />
  </svg>
);

const isUserMessage = (message: ConversationContent) =>
  ["user", "human", "me"].includes(message.speakerType.toLowerCase());

const Conversation = () => {
  const {
    conversations,
    selectedConversation,
    selectedId,
    onSelectConversation,
    message,
    onChangeMessage,
    isLoading,
    isError,
  } = useConversationController();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    // Message delivery is intentionally left for the WebSocket integration.
  };

  return (
    <section className="relative -mx-4 -my-8 flex h-[calc(100vh-65px)] overflow-hidden bg-white sm:-mx-6">
      {isSidebarOpen && (
        <button
          aria-label="Close conversation menu"
          className="absolute inset-0 z-20 bg-slate-950/30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`absolute inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-200 bg-slate-50 transition-transform md:static md:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="border-b border-slate-200 p-3">
          <div className="flex items-center gap-2 px-2 py-2 font-bold text-ink-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-sm text-white">AI</span>
            Conversations
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Recent</p>
          {isLoading && <p className="px-3 py-4 text-sm text-ink-600">Loading conversations...</p>}
          {isError && <p className="px-3 py-4 text-sm text-rose-600">Could not load conversations.</p>}
          {!isLoading && !isError && conversations.length === 0 && (
            <p className="px-3 py-4 text-sm text-ink-600">No conversations yet.</p>
          )}
          <ul className="grid gap-1">
            {conversations.map((conversation) => (
              <li key={conversation.id}>
                <button
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm transition ${selectedId === conversation.id ? "bg-primary-50 font-semibold text-primary-700" : "text-ink-900 hover:bg-slate-200/70"}`}
                  onClick={() => {
                    onSelectConversation(conversation.id);
                    setIsSidebarOpen(false);
                  }}
                >
                  <span className="shrink-0 text-ink-600"><ChatIcon /></span>
                  <span className="truncate">{conversation.title || "Untitled conversation"}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-4 sm:px-6">
          <button aria-label="Open conversation menu" className="rounded-lg p-2 text-ink-600 hover:bg-slate-100 md:hidden" onClick={() => setIsSidebarOpen(true)}>
            <MenuIcon />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-ink-900">{selectedConversation?.title ?? "AI Assistant"}</h1>
            <p className="text-xs text-ink-600">MQTT AI conversation</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end px-4 py-8 sm:px-8">
            {!selectedConversation ? (
              <div className="my-auto text-center">
                <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><ChatIcon /></span>
                <h2 className="text-xl font-bold text-ink-900">Select a conversation</h2>
                <p className="mt-2 text-sm text-ink-600">Choose one from the sidebar to see its messages.</p>
              </div>
            ) : selectedConversation.contents?.length ? (
              <div className="grid gap-7">
                {selectedConversation.contents.map((item) => {
                  const user = isUserMessage(item);
                  return (
                    <article key={item.id} className={`flex gap-3 ${user ? "justify-end" : "justify-start"}`}>
                      {!user && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">AI</span>}
                      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${user ? "rounded-br-md bg-slate-100 text-ink-900" : "rounded-tl-md border border-slate-200 bg-white text-ink-900 shadow-sm"}`}>
                        {item.content}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="my-auto text-center">
                <h2 className="text-xl font-bold text-ink-900">Start the conversation</h2>
                <p className="mt-2 text-sm text-ink-600">Messages for this conversation will appear here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 bg-gradient-to-t from-white via-white to-transparent px-4 pb-5 pt-3 sm:px-8">
          <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-lg shadow-slate-200/60 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10">
              <textarea
                aria-label="Message"
                className="max-h-40 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-ink-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                placeholder={selectedConversation ? "Message AI..." : "Select a conversation first"}
                rows={1}
                value={message}
                disabled={!selectedConversation}
                onChange={(event) => onChangeMessage(event.target.value)}
              />
              <button
                aria-label="Send message"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                disabled={!selectedConversation || !message.trim()}
                type="submit"
              >
                <SendIcon />
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-slate-400">Connect this composer to your WebSocket send handler.</p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Conversation;
