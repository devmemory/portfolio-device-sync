import React, { SubmitEvent, useMemo } from "react";
import { Show } from "src/components/Condition";
import ChattingBar from "./component/ChattingBar";
import ChattingList from "./component/ChattingList";
import { MenuIcon } from "./component/Icons";
import SideBar from "./component/SideBar";
import DeleteConversationModal from "./modal/DeleteConversationModal";
import useContentController from "./useContentController";
import useConversationController from "./useConversationController";
import useSideBarController from "./useSideBarController";

const Conversation = () => {
  const {
    conversations,
    selectedConversation,
    selectedId,
    onSelectConversation,
    onNewConversation,
    removingConversationId,
    onOpenRemove,
    onCancelRemove,
    onConfirmRemove,
    isLoading,
    isError,
    onConversationCreated,
  } = useConversationController();

  const {
    contentList,
    message,
    onChangeMessage,
    onSendMessage,
    isSending,
    canLoadMore,
    isLoadingMore,
    onLoadMore,
  } = useContentController({ selectedId, onConversationCreated });

  const { isSidebarOpen, setIsSidebarOpen } = useSideBarController();

  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    onSendMessage();
  };

  const contentState = useMemo(() => {
    if (contentList.length > 0) {
      return "content";
    }

    if (!selectedConversation && selectedId !== null) {
      return "select";
    }

    return "newchat";
  }, [selectedConversation, selectedId, contentList]);

  return (
    <section className="relative -mx-4 -my-8 flex h-[calc(100dvh-65px)] overflow-hidden bg-white sm:-mx-6">
      <button
        aria-label="Close conversation menu"
        className={`absolute inset-0 z-30 bg-slate-950/35 transition-opacity md:hidden ${isSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setIsSidebarOpen(false)}
        tabIndex={isSidebarOpen ? 0 : -1}
        type="button"
      />
      <SideBar
        conversations={conversations}
        selectedId={selectedId}
        onSelectConversation={onSelectConversation}
        onNewConversation={onNewConversation}
        onRemoveConversation={onOpenRemove}
        isLoading={isLoading}
        isError={isError}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-3 sm:px-6">
          <button
            aria-expanded={isSidebarOpen}
            aria-label="Open conversation menu"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-ink-600 hover:bg-slate-100 md:hidden"
            onClick={() => setIsSidebarOpen(true)}
            type="button"
          >
            <MenuIcon />
          </button>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-ink-900">
              {selectedConversation?.title ?? "AI Assistant"}
            </h1>
            <p className="text-xs text-ink-600">AMQP AI conversation</p>
          </div>
        </header>

        <ChattingList
          selectedId={selectedId}
          contentState={contentState}
          contentList={contentList}
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={onLoadMore}
        />

        <ChattingBar
          message={message}
          isSending={isSending}
          onChangeMessage={onChangeMessage}
          onSubmit={onSubmit}
        />
      </div>

      <Show when={removingConversationId !== null}>
        <DeleteConversationModal
          conversationId={removingConversationId}
          conversationTitle={
            conversations.find(({ id }) => id === removingConversationId)?.title
          }
          onCancelRemove={onCancelRemove}
          onConfirmRemove={onConfirmRemove}
        />
      </Show>
    </section>
  );
};

export default Conversation;
