export interface BlocklistModalProps {
    isOpen: boolean;
    onClose: () => void;
  }
  
  export interface BlockedItem {
    url: string;
    isActive: boolean;
  }
  
  export interface Notification {
    message: string;
    type: "error" | "success";
  }