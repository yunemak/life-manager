import EntryDialog, { type EntryDialogProps } from "../entries/EntryDialog";
import DeleteEntryDialog, {
    type DeleteEntryDialogProps,
} from "../entries/DeleteEntryDialog";
import CategoryDialog, {
    type CategoryDialogProps,
} from "../settings/CategoryDialog";
import NoticeToast from "./NoticeToast";

interface AppDialogsProps {
    entry: EntryDialogProps;
    category: CategoryDialogProps;
    deletion: DeleteEntryDialogProps;
    notice: string;
    onNoticeClose: () => void;
}

export default function AppDialogs({
    entry,
    category,
    deletion,
    notice,
    onNoticeClose,
}: AppDialogsProps) {
    return (
        <>
            <CategoryDialog {...category} />
            <EntryDialog {...entry} />
            <DeleteEntryDialog {...deletion} />
            <NoticeToast message={notice} onClose={onNoticeClose} />
        </>
    );
}
