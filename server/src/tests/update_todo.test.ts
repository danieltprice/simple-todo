
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (input: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description || null,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    // Create test todo
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update todo description', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toBe(false);
  });

  it('should update todo completion status', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Test description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('Test description');
    expect(result.completed).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'New Title',
      description: 'New description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Some description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    expect(result.description).toBeNull();
    expect(result.title).toEqual('Test Todo');
  });

  it('should save changes to database', async () => {
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    await updateTodo({
      id: testTodo.id,
      title: 'Updated Title',
      completed: true
    });

    // Verify changes are persisted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, testTodo.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Original description');
    expect(todos[0].completed).toBe(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error for non-existent todo', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999,
      title: 'Non-existent todo'
    };

    expect(updateTodo(updateInput)).rejects.toThrow(/Todo with id 999 not found/i);
  });

  it('should always update the updated_at timestamp', async () => {
    const testTodo = await createTestTodo({
      title: 'Test Todo',
      description: 'Test description'
    });

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const result = await updateTodo({
      id: testTodo.id,
      title: 'Same Title' // Even minimal changes should update timestamp
    });

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });
});
