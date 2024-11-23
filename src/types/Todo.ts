export interface Todo {
    id: string;
    text: string;
    completed: boolean;
  }
  
  export interface TodoListProps {
    onPresetTimer?: (
      title: string,
      hours: number,
      minutes: number,
      seconds: number
    ) => void;
    activeTimerTitle?: string | null;
  }