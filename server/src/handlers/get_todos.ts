
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    const results = await db.select()
      .from(todosTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};
