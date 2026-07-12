import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { PageModel } from "src/models";
import { apiManager } from "src/services/api/ApiManager";

const initialPageModel: PageModel = {
  page: 1,
  limit: 30,
  order: "DESC",
  orderBy: "updatedAt",
};

const useConversationController = () => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["conversationList", initialPageModel],
    queryFn: () => apiManager.conversationApi.getList(initialPageModel),
  });

  useEffect(() => {
    if (selectedId === null && data?.list.length) {
      setSelectedId(data.list[0].id);
    }
  }, [data?.list, selectedId]);

  const selectedConversation =
    data?.list.find((conversation) => conversation.id === selectedId) ?? null;

  return {
    conversations: data?.list ?? [],
    selectedConversation,
    selectedId,
    onSelectConversation: setSelectedId,
    message,
    onChangeMessage: setMessage,
    isLoading,
    isError,
  };
};

export default useConversationController;
