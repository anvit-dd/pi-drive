import { Button, Dialog, TextField } from "@radix-ui/themes";
import React from "react";
import { useOpenNewFolderDialog } from "../../store/ui-variables";
import { useNewFolderName } from "../../store/drive-variables";

export default function NewFolderDialog({
  createFolder,
  isLoading,
  setIsLoading,
}: {
  createFolder: () => void;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}) {
  const isDialogOpen = useOpenNewFolderDialog((state) => state.open);
  const setIsNewFolderDialogOpen = useOpenNewFolderDialog(
    (state) => state.setOpen
  );
  const setNewItemName = useNewFolderName((state) => state.setNewItemName);

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Create New Folder</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Enter a name for your new folder. You can create multiple folders by
          adding a /.
        </Dialog.Description>

        <div className="mb-4">
          <TextField.Root
            className="!font-sans"
            placeholder="Enter a folder name..."
            disabled={isLoading}
            onChange={(e) => {
              setNewItemName(e.target.value);
            }}
          >
            <TextField.Slot></TextField.Slot>
          </TextField.Root>
        </div>

        <div className="flex justify-end gap-2">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={isLoading}>
              Cancel
            </Button>
          </Dialog.Close>
          <Button
            onClick={() => {
              setIsLoading(true);
              createFolder();
            }}
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
