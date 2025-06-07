
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Trash2, Plus } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTodoTitle, setNewTodoTitle] = useState('');

  const loadTodos = useCallback(async () => {
    try {
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleCreateTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;

    setIsLoading(true);
    try {
      const todoData: CreateTodoInput = {
        title: newTodoTitle.trim(),
        description: null
      };
      const newTodo = await trpc.createTodo.mutate(todoData);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      setNewTodoTitle('');
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleTodo = async (id: number) => {
    try {
      const updatedTodo = await trpc.toggleTodo.mutate({ id });
      setTodos((prev: Todo[]) =>
        prev.map((todo: Todo) =>
          todo.id === id ? updatedTodo : todo
        )
      );
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await trpc.deleteTodo.mutate({ id });
      setTodos((prev: Todo[]) => prev.filter((todo: Todo) => todo.id !== id));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📝 Todo List</h1>
          <p className="text-gray-600">Keep track of your tasks with this simple todo app</p>
        </div>

        <Card className="mb-6 shadow-sm">
          <CardContent className="p-6">
            <form onSubmit={handleCreateTodo} className="flex gap-3">
              <Input
                placeholder="Add a new task..."
                value={newTodoTitle}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewTodoTitle(e.target.value)
                }
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" disabled={isLoading || !newTodoTitle.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                {isLoading ? 'Adding...' : 'Add'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {totalCount > 0 && (
          <div className="mb-4 flex justify-between items-center text-sm text-gray-600">
            <span>
              {completedCount} of {totalCount} completed
            </span>
            <div className="flex items-center gap-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                />
              </div>
              <span className="font-medium">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
              </span>
            </div>
          </div>
        )}

        {todos.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-12 text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
              <p className="text-gray-500">Add your first task above to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardContent className="p-0">
              {todos.map((todo: Todo, index: number) => (
                <div key={todo.id}>
                  <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggleTodo(todo.id)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 
                        className={`font-medium transition-all ${
                          todo.completed 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-900'
                        }`}
                      >
                        {todo.title}
                      </h3>
                      {todo.description && (
                        <p className={`text-sm mt-1 ${
                          todo.completed ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {todo.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1">
                        Created {todo.created_at.toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTodo(todo.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {index < todos.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {todos.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            ✨ Great job! Keep up the productivity!
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
