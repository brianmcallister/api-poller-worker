import { describe, expect, it } from 'vitest';

import { createEmptyMsg, diff, normalize } from '../records';

describe('normalize', () => {
  it('keys objects by their unique key, keeping their order', () => {
    expect(normalize([{ id: 'b' }, { id: 'a' }], 'id')).toStrictEqual({
      ids: ['b', 'a'],
      byId: { b: { id: 'b' }, a: { id: 'a' } },
    });
  });

  it('turns numeric IDs into strings', () => {
    expect(normalize([{ id: 7 }], 'id')).toStrictEqual({ ids: ['7'], byId: { '7': { id: 7 } } });
  });

  it('uses a different unique key', () => {
    expect(normalize([{ sku: 'x', id: 1 }], 'sku').ids).toStrictEqual(['x']);
  });

  it('throws when an object has no unique key', () => {
    expect(() => normalize([{ name: 'no id' }], 'id')).toThrow(
      'does not have a property named "id"',
    );
  });
});

describe('diff', () => {
  const records = (...items: { id: string; price: number }[]) => normalize(items, 'id');

  it('reports everything as new the first time', () => {
    const msg = diff(
      createEmptyMsg<{ id: string; price: number }>().newItems,
      records({ id: 'a', price: 1 }),
    );

    expect(msg.newItems.ids).toStrictEqual(['a']);
    expect(msg.updatedItems.ids).toStrictEqual([]);
    expect(msg.removedItems).toStrictEqual([]);
  });

  it('finds new, updated and removed objects', () => {
    const before = records({ id: 'a', price: 1 }, { id: 'b', price: 2 }, { id: 'c', price: 3 });
    const after = records({ id: 'a', price: 1 }, { id: 'b', price: 20 }, { id: 'd', price: 4 });

    expect(diff(before, after)).toStrictEqual({
      newItems: { ids: ['d'], byId: { d: { id: 'd', price: 4 } } },
      updatedItems: { ids: ['b'], byId: { b: { id: 'b', price: 20 } } },
      removedItems: ['c'],
    });
  });

  it('reports nothing when nothing changed', () => {
    const same = records({ id: 'a', price: 1 });

    expect(diff(same, records({ id: 'a', price: 1 }))).toStrictEqual(createEmptyMsg());
  });
});
