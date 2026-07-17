import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { PageModel } from "src/models";
import { apiManager } from "src/services/api/ApiManager";
import { popupEventBus } from "src/utils/popupUtil";

const useConversationController = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [removingConversationId, setRemovingConversationId] = useState<
    number | null
  >(null);
  const [pageModel, setPageModel] = useState<PageModel>({ page: 1, limit: 10 });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["conversationList", pageModel],
    queryFn: () => apiManager.conversationApi.getList(pageModel),
  });

  const selectedConversation = useMemo(() => {
    return (
      data?.list.find((conversation) => conversation.id === selectedId) ?? null
    );
  }, [data, selectedId]);

  const onNewConversation = () => {
    setSelectedId(null);
  };

  const onConversationCreated = (conversationId: number) => {
    setSelectedId(conversationId);
    refetch();
  };

  const onOpenRemove = (conversationId: number) => {
    setRemovingConversationId(conversationId);
  };

  const onCancelRemove = () => {
    setRemovingConversationId(null);
  };

  const onConfirmRemove = (value?: boolean) => {
    if (!value) {
      popupEventBus.emit("Failed to delete conversation");
      return;
    }

    if (selectedId === removingConversationId) {
      onNewConversation();
    }

    setRemovingConversationId(null);
    refetch();
    popupEventBus.emit("Conversation deleted successfully");
  };

  return {
    conversations: data?.list ?? [],
    selectedConversation,
    selectedId,
    onSelectConversation: setSelectedId,
    onNewConversation,
    onConversationCreated,
    removingConversationId,
    onOpenRemove,
    onCancelRemove,
    onConfirmRemove,
    isLoading,
    isError,
  };
};

export default useConversationController;
