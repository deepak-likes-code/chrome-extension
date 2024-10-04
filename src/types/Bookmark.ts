export interface Bookmark {
    id: string;
    url: string;
    title: string;
    folderId: string | null;
}

export interface BookmarkGridProps {
    selectedFolder: string | null;
    onBackToFolders: () => void;
}