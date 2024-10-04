export interface Folder {
    id: string;
    name: string;
}

export interface FolderGridProps {
    onSelectFolder: (folderId: string | null) => void;
}
