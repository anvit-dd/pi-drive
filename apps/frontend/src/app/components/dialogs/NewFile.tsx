import React from "react";
import { Button, Dialog, TextField } from "@radix-ui/themes";
import { useOpenNewFileDialog } from "../../store/ui-variables";
import { useNewFileName } from "../../store/drive-variables";

export default function NewFileDialog({
  createFile,
  isLoading,
  setIsLoading,
}: {
  createFile: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}) {
  const isDialogOpen = useOpenNewFileDialog((state) => state.open);
  const setIsNewFileDialogOpen = useOpenNewFileDialog((state) => state.setOpen);
  const setNewItemName = useNewFileName((state) => state.setNewItemName);

  return (
    <Dialog.Root open={isDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
      <Dialog.Content maxWidth="450px">
        <Dialog.Title>Create New File</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Enter a name for your new file.
        </Dialog.Description>

        <div className="mb-4">
          <TextField.Root
            className="!font-sans"
            placeholder="Enter a file name..."
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
              createFile();
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
