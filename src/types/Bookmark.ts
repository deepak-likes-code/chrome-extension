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



export interface BookmarkGridProps {
  selectedFolder: string | null;
  onBackToFolders: () => void;
}


export interface AddBookmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (url: string, title: string) => void;
  }