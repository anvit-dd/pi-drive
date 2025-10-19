import { Button, Dialog, TextField } from "@radix-ui/themes";
import React from "react";
import { useOpenRenameDialog } from "@/app/store/ui-variables";
import {
  useSelectedItems,
  useRenamedFileName,
} from "@/app/store/drive-variables";
import { useRenameFile } from "@/app/hooks/useRenameFile";

export default function RenameDialog() {
  const isDialogOpen = useOpenRenameDialog((state) => state.open);
  const setIsRenameDialogOpen = useOpenRenameDialog((state) => state.setOpen);

  const selectedItem = useSelectedItems((state) => state.selectedItems);
  const setNewName = useRenamedFileName((state) => state.setNewItemName);

  const { handleRename, isRenaming } = useRenameFile();

  const fileToBeRenamed =
    selectedItem.size > 0 ? Array.from(selectedItem)[0] : null;

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={setIsRenameDialogOpen}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Rename {fileToBeRenamed?.is_dir? "Folder": "File"}</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Enter a new name for {fileToBeRenamed && fileToBeRenamed.name}
        </Dialog.Description>

        <div className="mb-4">
          <TextField.Root
            className="!font-sans w-full"
            placeholder={fileToBeRenamed ? fileToBeRenamed.name : ""}
            disabled={isRenaming}
            onChange={(e) => {
              setNewName(e.target.value);
            }}
          >
            <TextField.Slot></TextField.Slot>
          </TextField.Root>
        </div>

        <div className="flex justify-end gap-2">
          <Dialog.Close>
            <Button variant="soft" color="gray" disabled={isRenaming}>
              Cancel
            </Button>
          </Dialog.Close>
          <Button
            onClick={() => {
              handleRename();
            }}
            disabled={isRenaming}
            loading={isRenaming}
          >
            {isRenaming ? "Renaming..." : "Rename"}
          </Button>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  );
}
