import React, { useLayoutEffect, useRef } from "react";
import { Show, Switch } from "src/components/Condition";
import { SPEAKER_TYPE } from "src/constants";
import { ConversationContent } from "src/models";
import { ChatIcon } from "./Icons";
import MarkdownContent from "./MarkdownContent";

interface Props {
  selectedId: number | null;
  contentState: "select" | "content" | "newchat";
  contentList: ConversationContent[];
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

const ChattingList = ({
  selectedId,
  contentState,
  contentList,
  canLoadMore,
  isLoadingMore,
  onLoadMore,
}: Props) => {
  const contentViewportRef = useRef<HTMLDivElement>(null);
  const shouldFollowLatestContentRef = useRef(true);
  const heightBeforeLoadRef = useRef<number | null>(null);

  const previousSelectedIdRef = useRef(selectedId);

  useLayoutEffect(() => {
    const viewport = contentViewportRef.current;

    if (!viewport) return;

    const conversationChanged = previousSelectedIdRef.current !== selectedId;
    previousSelectedIdRef.current = selectedId;

    if (conversationChanged) {
      heightBeforeLoadRef.current = null;
    } else if (heightBeforeLoadRef.current !== null) {
      viewport.scrollTop += viewport.scrollHeight - heightBeforeLoadRef.current;
      heightBeforeLoadRef.current = null;
      return;
    }

    if (conversationChanged || shouldFollowLatestContentRef.current) {
      viewport.scrollTop = viewport.scrollHeight;
      shouldFollowLatestContentRef.current = true;
    }
  }, [selectedId, contentList]);

  const onContentScroll = () => {
    const viewport = contentViewportRef.current;

    if (!viewport) return;

    const distanceFromBottom =
      viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;

    shouldFollowLatestContentRef.current = distanceFromBottom <= 24;

    if (viewport.scrollTop <= 0 && canLoadMore && !isLoadingMore) {
      heightBeforeLoadRef.current = viewport.scrollHeight;
      onLoadMore();
    }
  };

  return (
    <div
      ref={contentViewportRef}
      className="min-h-0 flex-1 overscroll-y-contain overflow-y-auto"
      onScroll={onContentScroll}
    >
      <div className="mx-auto flex min-h-full w-full min-w-0 max-w-3xl flex-col justify-end px-3 py-5 sm:px-8 sm:py-8">
        <Switch
          when={contentState}
          select={
            <div className="my-auto text-center">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                <ChatIcon />
              </span>
              <h2 className="text-xl font-bold text-ink-900">
                Select a conversation
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Choose one from the sidebar to see its messages.
              </p>
            </div>
          }
          content={
            <div className="grid gap-7">
              {contentList.map((item) => {
                const user = item.speakerType === SPEAKER_TYPE.USER;
                return (
                  <article
                    key={item.id}
                    className={`flex gap-2 sm:gap-3 ${user ? "justify-end" : "justify-start"}`}
                  >
                    <Show when={!user}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
                        AI
                      </span>
                    </Show>

                    <div
                      className={`min-w-0 max-w-[88%] rounded-2xl px-3 py-2.5 text-sm leading-6 sm:max-w-[85%] sm:px-4 sm:py-3 ${user ? "rounded-br-md bg-slate-100 text-ink-900" : "rounded-tl-md border border-slate-200 bg-white text-ink-900 shadow-sm"}`}
                    >
                      <MarkdownContent content={item.content} />
                    </div>
                  </article>
                );
              })}
            </div>
          }
          newchat={
            <div className="my-auto text-center">
              <h2 className="text-xl font-bold text-ink-900">
                Start the conversation
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Messages for this conversation will appear here.
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
};

export default ChattingList;
