import createEmptyMsg from '../createEmptyMsg';

describe('createEmptyMsg', () => {
  it('should work', () => {
    expect(createEmptyMsg()).toStrictEqual({
      newItems: {
        byId: {},
        ids: [],
      },
      updatedItems: {
        byId: {},
        ids: [],
      },
      removedItems: [],
    });
  })
})
