import produce from 'immer';

import createStoreCreator, { undoAction } from './index';

const INC = 'INC';
const DEC = 'DEC';

const reducer = (state = { counter: 0 }, action) => produce(state, (draft) => {
  switch (action.type) {
    case INC: {
      draft.counter += 1;
      break;
    }
    case DEC: {
      draft.counter -= 1;
      break;
    }
  }
});

describe('Store', () => {
  test('Store should work', () => {
    const createStore = createStoreCreator();

    const store = createStore(reducer);
    store.dispatch({
      type: INC
    });

    const state1 = store.getState();
    expect(state1.counter).toBe(1);
    store.dispatch({
      type: DEC
    });

    const state2 = store.getState();
    expect(state2.counter).toBe(0);
  });

  test('Should undo action', () => {
    const createStore = createStoreCreator();
    const store = createStore(reducer);
    store.dispatch({
      type: INC
    });
    store.dispatch({
      type: INC
    });
    store.dispatch({
      type: INC
    });
    store.dispatch({
      type: DEC
    });

    store.dispatch(undoAction(action => action.type === INC)); // should undo all INC

    const state = store.getState();
    expect(state.counter).toBe(-1);
  });

  test('Should work with maxActionHistory', () => {
    const createStore = createStoreCreator({ actionHistorySize: 15 });
    const store = createStore(reducer);

    for (let i = 0; i < 10; i += 1) {
      store.dispatch({
        type: INC
      });
    }

    for (let i = 0; i < 5; i += 1) {
      store.dispatch({
        type: DEC
      });
    }
    let state = store.getState();
    expect(state.counter).toBe(5);

    store.dispatch(undoAction(action => action.type === INC)); // should undo all INC

    state = store.getState();
    expect(state.counter).toBe(-5);
  });

  test('Shouldn\'t undo actions older maxActionHistory', () => {
    const createStore = createStoreCreator({ actionHistorySize: 5 });
    const store = createStore(reducer);

    for (let i = 0; i < 10; i += 1) {
      store.dispatch({
        type: INC
      });
    }

    for (let i = 0; i < 5; i += 1) {
      store.dispatch({
        type: DEC
      });
    }
    store.dispatch(undoAction(action => action.type === INC)); // should undo all INC

    const state = store.getState();
    expect(state.counter).toBe(5);
  });
});
