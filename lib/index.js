'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.undoAction = undefined;

var _redux = require('redux');

var _isPlainObject = require('./utils/isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var REPLACE_STATE_ACTION = 'redux-undo-any/REPLACE_STATE_ACTION';
var UNDO_ACTION = 'redux-undo-any/UNDO_ACTION';

var undoAction = exports.undoAction = function undoAction(testAction) {
  return {
    type: UNDO_ACTION,
    test: testAction
  };
};

var replaceState = function replaceState(state) {
  return {
    type: REPLACE_STATE_ACTION,
    state: state
  };
};

var hackReducer = function hackReducer(reducer) {
  return function (state, action) {
    if (action.type === REPLACE_STATE_ACTION) {
      return action.state;
    }
    return reducer(state, action);
  };
};

var getActionsApplier = function getActionsApplier(reducer) {
  return function (initState, actions) {
    return actions.reduce(function (state, action) {
      return reducer(state, action);
    }, initState);
  };
};

var clearAction = function clearAction(action) {
  return action.type === 'PERFORM_ACTION' ? action.action : action;
}; // https://github.com/zalmoxisus/redux-devtools-instrument/blob/master/src/instrument.js#L41

var createStoreCreator = function createStoreCreator() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
      _ref$actionHistorySiz = _ref.actionHistorySize,
      actionHistorySize = _ref$actionHistorySiz === undefined ? 1000 : _ref$actionHistorySiz;

  var lastState = void 0;
  var history = [];

  var createStore = function createStore(reducer, preloadedState, enhancer) {
    if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
      enhancer = preloadedState;
      preloadedState = undefined;
    }

    if (typeof enhancer !== 'undefined') {
      if (typeof enhancer !== 'function') {
        throw new Error('Expected the enhancer to be a function.');
      }

      return enhancer(createStore)(reducer, preloadedState);
    }

    var store = (0, _redux.createStore)(hackReducer(reducer), preloadedState);
    lastState = store.getState();
    // hack replaceReducer
    var originReplace = store.replaceReducer;
    store.replaceReducer = function replaceReducer(newReducer) {
      if (typeof newReducer !== 'function') {
        throw new Error('Expected the nextReducer to be a function.');
      }
      reducer = newReducer;
      return originReplace(hackReducer(newReducer));
    };

    var applyActions = getActionsApplier(reducer);

    // hack dispatch
    var originDispatch = store.dispatch;
    var dispatch = function dispatch(action) {
      if (!(0, _isPlainObject2.default)(action)) {
        throw new Error('Actions must be plain objects. ' + 'Use custom middleware for async actions.');
      }
      if (history.length > actionHistorySize) {
        lastState = reducer(lastState, history[0]);
        history.shift();
      }
      var clearedAction = clearAction(action);
      if (clearedAction.type !== REPLACE_STATE_ACTION) history.push(action);
      if (clearedAction.type === UNDO_ACTION) {
        if (clearedAction.test) {
          var actionsToApply = history.filter(function (a) {
            return !clearedAction.test(clearAction(a));
          });
          if (actionsToApply.length) {
            var newState = applyActions(lastState, actionsToApply);
            originDispatch(replaceState(newState));
          }
        }
      } else {
        originDispatch(action);
      }
    };

    // apply enhancer
    if (enhancer) {
      var middlewared = enhancer(function () {
        return {
          getState: store.getState,
          dispatch: dispatch
        };
      })(reducer, preloadedState);
      store.dispatch = middlewared.dispatch;
    } else {
      store.dispatch = dispatch;
    }

    return store;
  };

  return createStore;
};

exports.default = createStoreCreator;