import React, { SubmitEvent } from "react";
import { SendIcon } from "./Icons";

interface Props {
  message: string;
  isSending: boolean;
  onChangeMessage: (value: string) => void;
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
}

const ChattingBar = ({ message, isSending, onChangeMessage, onSubmit }: Props) => {
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key !== "Enter" ||
      event.shiftKey ||
      event.nativeEvent.isComposing ||
      !message.trim()
    ) {
      return;
    }

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <div className="shrink-0 bg-gradient-to-t from-white via-white to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-8 sm:pb-5 sm:pt-3">
      <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-300 bg-white p-2 shadow-lg shadow-slate-200/60 focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/10">
          <textarea
            aria-label="Message"
            className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2.5 text-base text-ink-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed sm:px-3 sm:text-sm"
            placeholder="Message AI..."
            rows={1}
            value={message}
            disabled={isSending}
            onChange={(event) => onChangeMessage(event.target.value)}
            onKeyDown={onKeyDown}
          />
          <button
            aria-label="Send message"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
            disabled={isSending || !message.trim()}
            type="submit"
          >
            <SendIcon />
          </button>
        </div>
        <p className="mt-2 hidden text-center text-xs text-slate-400 sm:block">
          Messages are delivered through your connected device.
        </p>
      </form>
    </div>
  );
};

export default ChattingBar;
