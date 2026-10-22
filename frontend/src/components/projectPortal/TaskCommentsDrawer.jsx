import React from "react";
import GlassModal from "../ui/GlassModal";
import GlassButton from "../ui/GlassButton";
import TaskComments from "./TaskComments";

export default function TaskCommentsDrawer({
  task,
  comments = [],
  onClose,
  onAddComment,
  onAddcomment,
  onDeleteComment,
  onDeletecomment,
  currentUserId,
}) {
  return (
    <GlassModal
      isOpen={!!task}
      onClose={onClose}
      title={task?.title}
      description="Task discussion"
      maxWidth="max-w-xl"
      footer={
        <GlassButton variant="secondary" onClick={onClose}>Close</GlassButton>
      }
    >
      <div className="flex flex-col gap-4">
        <TaskComments
          taskId={task?._id || task?.id}
          comments={comments}
          onAddComment={onAddComment || onAddcomment}
          onDeleteComment={onDeleteComment || onDeletecomment}
          currentUserId={currentUserId}
          maxListHeight="max-h-[440px]"
        />
      </div>
    </GlassModal>
  );
}
