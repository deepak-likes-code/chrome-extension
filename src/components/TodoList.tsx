import React, { useState, useEffect } from "react";
import { Clock, Trash2 } from "lucide-react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoListProps {
  onPresetTimer?: (
    title: string,
    hours: number,
    minutes: number,
    seconds: number
  ) => void;
  activeTimerTitle?: string | null;
}

const TodoList: React.FC<TodoListProps> = ({
  onPresetTimer,
  activeTimerTitle,
}) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    chrome.storage.local.get(["todos"], (result) => {
      if (result.todos) {
        setTodos(result.todos);
      }
    });
  }, []);

  useEffect(() => {
    chrome.storage.local.set({ todos });
  }, [todos]);

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([
        ...todos,
        { id: Date.now().toString(), text: newTodo, completed: false },
      ]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handlePresetTimer = (todo: Todo) => {
    if (onPresetTimer) {
      // Preset to 25 minutes
      onPresetTimer(todo.text, 0, 25, 0);
    }
  };

  return (
    <div className="bg-white bg-opacity-20 p-6 backdrop-blur-sm rounded-lg shadow-lg flex flex-col min-h-64">
      <div className="mb-6 flex">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addTodo()}
          placeholder="Add a new todo"
          className="flex-grow p-3 text-md border-2 border-gray-300 rounded-l-lg focus:outline-none focus:border-gray-500"
        />
        <button
          onClick={addTodo}
          className="bg-gray-600 hover:bg-gray-800 text-white text-xl font-bold p-3 rounded-r-lg transition duration-200"
        >
          +
        </button>
      </div>
      <ul className="overflow-auto pr-2 flex-grow text-md space-y-4">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`flex items-center p-4 rounded-lg mr-2 transition-all duration-200 ${
              activeTimerTitle === todo.text
                ? "bg-blue-100 border-2 border-blue-300"
                : "bg-gray-100"
            }`}
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="mr-4 w-6 h-6"
            />
            <span
              className={`flex-grow text-md ${
                todo.completed ? "line-through text-gray-500" : "text-gray-800"
              }`}
            >
              {todo.text}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePresetTimer(todo)}
                className={`p-2 rounded-full transition duration-200 ${
                  activeTimerTitle === todo.text
                    ? "bg-blue-500 text-white"
                    : "text-gray-500 hover:text-blue-500"
                }`}
                title="Set Timer (25min)"
              >
                <Clock className="w-5 h-5" />
              </button>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="p-2 rounded-full text-gray-500 hover:text-red-500 transition duration-200"
                title="Delete Todo"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
