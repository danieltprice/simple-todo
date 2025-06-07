
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
  });

  it('should return all todos', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First description',
          completed: false
        },
        {
          title: 'Second Todo',
          description: null,
          completed: true
        },
        {
          title: 'Third Todo',
          description: 'Third description',
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify first todo
    expect(result[0].title).toEqual('First Todo');
    expect(result[0].description).toEqual('First description');
    expect(result[0].completed).toEqual(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second todo
    expect(result[1].title).toEqual('Second Todo');
    expect(result[1].description).toBeNull();
    expect(result[1].completed).toEqual(true);
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);

    // Verify third todo
    expect(result[2].title).toEqual('Third Todo');
    expect(result[2].description).toEqual('Third description');
    expect(result[2].completed).toEqual(false);
    expect(result[2].id).toBeDefined();
    expect(result[2].created_at).toBeInstanceOf(Date);
    expect(result[2].updated_at).toBeInstanceOf(Date);
  });

  it('should return todos ordered by creation time', async () => {
    // Create todos with slight delay to ensure different timestamps
    await db.insert(todosTable)
      .values({
        title: 'Older Todo',
        description: 'Created first',
        completed: false
      })
      .execute();

    // Small delay to ensure different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(todosTable)
      .values({
        title: 'Newer Todo',
        description: 'Created second',
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual('Older Todo');
    expect(result[1].title).toEqual('Newer Todo');
    expect(result[0].created_at <= result[1].created_at).toBe(true);
  });
});
