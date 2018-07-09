import { createStore as originalCreateStore } from 'redux';

const REPLACE_STATE_ACTION = 'redux-undo-any/REPLACE_STATE_ACTION';
const UNDO_ACTION = 'redux-undo-any/UNDO_ACTION';

export const undoAction = testAction => ({
  type: UNDO_ACTION,
  test: testAction
});

const replaceState = state => ({
  type: REPLACE_STATE_ACTION,
  state
});


const hackReducer = reducer => (state, action) => {
  if (action.type === REPLACE_STATE_ACTION) {
    return action.state;
  }
  return reducer(state, action);
};

const getActionsApplier = reducer => (initState, actions) => actions.reduce(
  (state, action) => reducer(state, action),
  initState
);

const createStoreCreator = ({
  actionHistorySize = 1000
} = {}) => {
  let lastState;
  const history = [];

  const createStore = (reducer, preloadedState, enhancer) => {
    const store = originalCreateStore(hackReducer(reducer), preloadedState);
    lastState = store.getState();
    // hack replaceReducer
    const originReplace = store.replaceReducer;
    store.replaceReducer = function replaceReducer(newReducer) {
      reducer = newReducer;
      return originReplace(hackReducer(newReducer));
    };

    const applyActions = getActionsApplier(reducer);

    // hack dispatch
    const originDispatch = store.dispatch;
    const dispatch = (action) => {
      if (action.type !== REPLACE_STATE_ACTION) history.push(action);
      if (history.length > actionHistorySize) {
        lastState = reducer(lastState, history[0]);
        history.shift();
      }

      if (action.type === UNDO_ACTION) {
        if (action.test) {
          const actionsToApply = history.filter(a => !action.test(a));
          if (actionsToApply.length) {
            const newState = applyActions(lastState, actionsToApply);
            originDispatch(replaceState(newState));
          }
        }
      } else {
        originDispatch(action);
      }
    };

    // apply enhancer
    if (enhancer) {
      const middlewared = enhancer(() => ({
        getState: store.getState,
        dispatch
      }))(reducer, preloadedState);
      store.dispatch = middlewared.dispatch;
    } else {
      store.dispatch = dispatch;
    }

    return store;
  };


  return createStore;
};


export default createStoreCreator;
