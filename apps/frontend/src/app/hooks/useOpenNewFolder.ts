import { useOpenNewFolderDialog } from "../store/ui-variables";

export function useOpenNewFolder() {
    const isOpen = useOpenNewFolderDialog((state) => state.open);
    const setOpen = useOpenNewFolderDialog((state) => state.setOpen);

    const openDialog = () => setOpen(true);
    const closeDialog = () => setOpen(false);
    const toggleDialog = () => setOpen(!isOpen);

    return {
        isOpen,
        openDialog,
        closeDialog,
        toggleDialog,
        setOpen,
    };
}