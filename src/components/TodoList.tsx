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
    <div
      className=" bg-white bg-opacity-80 p-4 rounded flex flex-col min-h-64"
      style={{ minHeight: "16rem" }}
    >
      {/* <h2 className="text-xl mb-4">Todo List</h2> */}
      <div className="mb-4 flex">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Add a new todo"
          className="flex-grow p-2 text-md border rounded-l"
        />
        <button
          onClick={addTodo}
          className="bg-blue-500 text-white p-2 rounded-r"
        >
          +
        </button>
      </div>
      <ul className="overflow-auto flex-grow text-md">
        {todos.map((todo) => (
          <li key={todo.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id)}
              className="mr-2"
            />
            <span
              className={`flex-grow text-md ${
                todo.completed ? "line-through" : ""
              }`}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="ml-2 text-red-500"
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
