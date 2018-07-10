# redux-undo-any
Library that allow you to undo any redux action, not only last

## Get started

### migration from original redux:

```diff
-import { createStore } from 'redux';
+import createStoreCreator from 'redux-undo-any';

+const createStore = createStoreCreator(options);

const store = createStore(reducer, initState, enhancer);
```

### using

```javascript
import createStoreCreator, { undoAction } from 'redux-undo-any';

const createStore = createStoreCreator(options);

const store = createStore(reducer, initState, enhancer);

// some code

store.dispatch(undoAction((a) => a.type === 'INC')); // undo all 'INC' actions 
```


## API

### createStoreCreator
take `options` as parameter and returns `createStore` function

| field  | description | defaultValue |
| ------ | ----------- | ------------ |
| actionHistorySize  | defined size of action history. Only last `actionHistorySize` can be undone | 1000 |

```javascript
  defaultOptions = {
    actionHistorySize: 1000
  }
```

### undoAction

Takes `testFunction` as parameter and return redux action to dispatch. Dispatched action will undo all last `actionHistorySize` actions for which `testFunction(action)` is `true`

```javascript
import { undoAction } from 'redux-undo-any';

// some code

// undo all actions which `type` is 'SET' and `payload.id` equal 100
store.dispatch(
  undoAction(action => action.type === 'SET' && action.payload.id === 100)
);

```
