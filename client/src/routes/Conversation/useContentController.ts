import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { SPEAKER_TYPE } from "src/constants";
import { usePagination } from "src/hooks";
import { ConversationContent } from "src/models";
import { apiManager } from "src/services/api/ApiManager";
import { AIService } from "src/services/socket/ai";
import { popupEventBus } from "src/utils/popupUtil";

interface Props {
  selectedId: number | null;
  onConversationCreated: (conversationId: number) => void;
}

const useContentController = ({ selectedId, onConversationCreated }: Props) => {
  const { id } = useParams<{ id: string }>();
  const { pageModel, onChangePage, onSetTotal } = usePagination();
  const service = useRef<AIService | null>(null);
  const streamContentId = useRef<number | null>(null);
  const nextTemporaryId = useRef<number>(-1);
  const [contentList, setContentList] = useState<ConversationContent[]>([]);
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["conversationContents", selectedId, pageModel.page],
    queryFn: async () => {
      const response = await apiManager.conversationApi.getContents(selectedId!, {
        page: pageModel.page,
        limit: pageModel.limit,
      });

      if (!response) {
        throw new Error("Failed to load conversation contents");
      }

      return { ...response, page: pageModel.page };
    },
    enabled: selectedId !== null,
  });

  useEffect(() => {
    const deviceId = Number(id);

    if (!deviceId || Number.isNaN(deviceId)) {
      popupEventBus.emit("Invalid device id");
      return;
    }

    const aiService = new AIService(deviceId, selectedId);
    service.current = aiService;
    aiService.onMessage((chunk) => {
      setContentList((current) => {
        if (streamContentId.current === null) {
          const id = nextTemporaryId.current--;
          streamContentId.current = id;

          return [
            ...current,
            {
              id,
              content: chunk,
              speakerType: SPEAKER_TYPE.AI,
              createdAt: new Date().toISOString(),
            },
          ];
        }

        return current.map((content) =>
          content.id === streamContentId.current
            ? { ...content, content: content.content + chunk }
            : content,
        );
      });
    });

    return () => {
      aiService.dispose();
      service.current = null;
    };
  }, [id]);

  useEffect(() => {
    onChangePage(1);

    if (service.current?.currentConversationId === selectedId) return;

    service.current?.selectConversation(selectedId);
    streamContentId.current = null;
    setContentList([]);
    setMessage("");
  }, [selectedId]);

  useEffect(() => {
    if (data?.total !== undefined) {
      onSetTotal(data.total);
    }
  }, [data?.total]);

  useEffect(() => {
    if (data) {
      setContentList((current) => {
        const pendingContents = current.filter(
          (content) =>
            content.id < 0 &&
            !data.list.some(
              (savedContent) =>
                savedContent.speakerType === content.speakerType &&
                savedContent.content === content.content,
            ),
        );

        if (data.page === 1) {
          return [...data.list, ...pendingContents];
        }

        const currentIds = new Set(current.map(({ id }) => id));
        return [
          ...data.list.filter(({ id }) => !currentIds.has(id)),
          ...current,
        ];
      });
    }
  }, [data]);

  const canLoadMore =
    data !== undefined &&
    data.list.length >= pageModel.limit &&
    pageModel.page < pageModel.lastPage &&
    !isFetching;

  const onLoadMore = () => {
    if (!canLoadMore) return;
    onChangePage(pageModel.page + 1);
  };

  const onSendMessage = async () => {
    const prompt = message.trim();

    if (!prompt || !service.current || isSending) return;

    const userContent: ConversationContent = {
      id: nextTemporaryId.current--,
      content: prompt,
      speakerType: SPEAKER_TYPE.USER,
      createdAt: new Date().toISOString(),
    };

    setIsSending(true);
    streamContentId.current = null;
    setContentList((current) => [...current, userContent]);

    try {
      const response = await service.current.sendMessage(prompt);
      setMessage("");

      if (selectedId === null) {
        onConversationCreated(response.conversationId);
      }
    } catch (error) {
      setContentList((current) =>
        current.filter(({ id }) => id !== userContent.id),
      );
      popupEventBus.emit(
        error instanceof Error ? error.message : "Failed to send message",
      );
    } finally {
      setIsSending(false);
    }
  };

  return {
    contentList,
    message,
    onChangeMessage: setMessage,
    onSendMessage,
    isSending,
    isLoading,
    isError,
    pageModel,
    onChangePage,
    canLoadMore,
    isLoadingMore: isFetching && pageModel.page > 1,
    onLoadMore,
  };
};

export default useContentController;
