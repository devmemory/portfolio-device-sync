import { useMutation } from "@tanstack/react-query";
import React from "react";
import { Button } from "src/components/Button";
import { Modal } from "src/components/Modal";
import { apiManager } from "src/services/api/ApiManager";
import { commonUtil } from "src/utils";

interface Props {
  conversationId: number | null;
  conversationTitle?: string;
  onConfirmRemove: (value: boolean | undefined) => void;
  onCancelRemove: VoidFunction;
}

const DeleteConversationModal = ({
  conversationId,
  conversationTitle,
  onConfirmRemove,
  onCancelRemove,
}: Props) => {
  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) =>
      apiManager.conversationApi.removeConversation(id),
    onSuccess: onConfirmRemove,
    onError: commonUtil.handleError,
  });

  const onDelete = () => {
    if (conversationId !== null) {
      mutate(conversationId);
    }
  };

  return (
    <Modal
      description="This action permanently removes the conversation and its messages."
      isOpen
      onClose={onCancelRemove}
      title="Delete conversation"
    >
      <div className="grid gap-5">
        <p className="text-sm text-ink-900">
          Are you sure you want to delete
          {conversationTitle ? (
            <strong className="font-semibold"> “{conversationTitle}”</strong>
          ) : (
            " this conversation"
          )}
          ?
        </p>
        <div className="flex justify-end gap-2">
          <Button disabled={isPending} onClick={onCancelRemove} variant="secondary">
            Cancel
          </Button>
          <Button disabled={isPending} onClick={onDelete} variant="danger">
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteConversationModal;
