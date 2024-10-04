import React, { useState, useEffect } from "react";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

const TodoList: React.FC = () => {
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

  return (
    <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg flex flex-col min-h-64">
      <div className="mb-6 flex">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
          className="flex-grow p-3 text-md border-2 border-gray-300 rounded-l-lg focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 hover:bg-blue-600 text-white text-xl font-bold p-3 rounded-r-lg transition duration-200"
        >
          +
        </button>
      </div>
      <ul className="overflow-auto flex-grow text-md space-y-4">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center bg-gray-100 p-4 rounded-lg"
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
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-4 text-red-500 hover:text-red-700 text-xl transition duration-200"
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoList;
