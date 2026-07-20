import { describe, it, expect } from 'vitest';
import reducer, {
  setPlaygroundCollection,
  updateCollectionEnvironments,
  updateEnvironmentVariable,
  resetPlaygroundEnvironments,
  selectHydratedCollection,
  selectPlaygroundCollection,
  setViewMode,
  setSelectedExampleIndex,
  clearPlaygroundCollection,
  toggleFolderCollapse,
  expandFolders
} from './playground';
import { createOpenCollectionStore } from '../store';
import type { OpenCollection as OpenCollectionCollection } from '@opencollection/types';

const makeCollection = () =>
  ({
    info: { name: 'Test', version: '1.0.0' },
    config: {
      environments: [
        { name: 'Dev', variables: [{ name: 'a', value: '1' }, { name: 'b', value: '2' }] }
      ]
    },
    items: []
  }) as any;

const envVariables = (store: ReturnType<typeof createOpenCollectionStore>) =>
  selectHydratedCollection(store.getState())!.config!.environments![0].variables!;

describe('resetPlaygroundEnvironments', () => {
  it('restores the original environments after an edit', () => {
    const store = createOpenCollectionStore();
    store.dispatch(setPlaygroundCollection(makeCollection()));

    const edited = makeCollection();
    edited.config.environments[0].variables = [{ name: 'a', value: '1' }];
    store.dispatch(updateCollectionEnvironments(edited));
    expect(envVariables(store)).toHaveLength(1);

    store.dispatch(resetPlaygroundEnvironments());
    expect(envVariables(store).map((v: any) => v.name)).toEqual(['a', 'b']);
  });

  it('keeps the restore independent of later edits (cloned, not shared)', () => {
    const store = createOpenCollectionStore();
    store.dispatch(setPlaygroundCollection(makeCollection()));

    store.dispatch(resetPlaygroundEnvironments());
    const edited = makeCollection();
    edited.config.environments[0].variables = [];
    store.dispatch(updateCollectionEnvironments(edited));

    store.dispatch(resetPlaygroundEnvironments());
    expect(envVariables(store)).toHaveLength(2);
  });
});

describe('playground example view', () => {
  it('accepts the example view mode', () => {
    const s = reducer(undefined, setViewMode('example'));
    expect(s.viewMode).toBe('example');
  });

  it('sets and resets the selected example index', () => {
    const set = reducer(undefined, setSelectedExampleIndex(3));
    expect(set.selectedExampleIndex).toBe(3);
    const cleared = reducer(set, clearPlaygroundCollection());
    expect(cleared.selectedExampleIndex).toBeNull();
  });
});

describe('updateEnvironmentVariable', () => {
  const envVarsIn = (
    store: ReturnType<typeof createOpenCollectionStore>,
    select: typeof selectHydratedCollection
  ) => select(store.getState())!.config!.environments![0].variables! as any[];

  const withVars = (variables: any[]) => {
    const collection = makeCollection();
    collection.config.environments[0].variables = variables;
    return collection;
  };

  it('edits a variable value in the active env, in both collection copies, leaving siblings alone', () => {
    const store = createOpenCollectionStore();
    store.dispatch(setPlaygroundCollection(makeCollection()));

    store.dispatch(updateEnvironmentVariable({ envName: 'Dev', varName: 'a', value: '42' }));

    for (const select of [selectHydratedCollection, selectPlaygroundCollection]) {
      const vars = envVarsIn(store, select);
      expect(vars.find((v) => v.name === 'a').value).toBe('42');
      expect(vars.find((v) => v.name === 'b').value).toBe('2');
    }
  });

  it('preserves a typed value shape ({ type, data })', () => {
    const store = createOpenCollectionStore();
    store.dispatch(setPlaygroundCollection(withVars([{ name: 'count', value: { type: 'number', data: '3' } }])));

    store.dispatch(updateEnvironmentVariable({ envName: 'Dev', varName: 'count', value: '9' }));

    expect(envVarsIn(store, selectHydratedCollection).find((v) => v.name === 'count').value).toEqual({
      type: 'number',
      data: '9'
    });
  });

  it('updates the last variable when names collide (matches the resolver’s last-write-wins)', () => {
    const store = createOpenCollectionStore();
    store.dispatch(
      setPlaygroundCollection(withVars([{ name: 'dup', value: 'first' }, { name: 'dup', value: 'second' }]))
    );

    store.dispatch(updateEnvironmentVariable({ envName: 'Dev', varName: 'dup', value: 'edited' }));

    expect(envVarsIn(store, selectHydratedCollection).map((v) => v.value)).toEqual(['first', 'edited']);
  });

  it('never edits a secret variable', () => {
    const store = createOpenCollectionStore();
    store.dispatch(setPlaygroundCollection(withVars([{ name: 'token', secret: true, value: 'keep' }])));

    store.dispatch(updateEnvironmentVariable({ envName: 'Dev', varName: 'token', value: 'leak' }));

    expect(envVarsIn(store, selectHydratedCollection).find((v) => v.name === 'token').value).toBe('keep');
  });

  it('is a no-op for an unknown environment or variable name', () => {
    const store = createOpenCollectionStore();
    store.dispatch(setPlaygroundCollection(makeCollection()));

    store.dispatch(updateEnvironmentVariable({ envName: 'Nope', varName: 'a', value: 'x' }));
    store.dispatch(updateEnvironmentVariable({ envName: 'Dev', varName: 'missing', value: 'x' }));

    expect(envVarsIn(store, selectHydratedCollection).find((v) => v.name === 'a').value).toBe('1');
  });
});

describe('playground folder collapse', () => {
  const withFolder = () =>
    ({
      info: { name: 'Test', version: '1.0.0' },
      items: [{ type: 'folder', uuid: 'f1', name: 'Folder', isCollapsed: false, items: [] }]
    }) as unknown as OpenCollectionCollection;
  const folder = (store: ReturnType<typeof createOpenCollectionStore>) =>
    selectHydratedCollection(store.getState())!.items![0] as { isCollapsed?: boolean };

  it('expandFolders reveals a collapsed folder', () => {
    const store = createOpenCollectionStore();
    store.dispatch(setPlaygroundCollection(withFolder()));
    store.dispatch(toggleFolderCollapse('f1'));
    expect(folder(store).isCollapsed).toBe(true);

    store.dispatch(expandFolders(['f1']));
    expect(folder(store).isCollapsed).toBe(false);
  });

  it('expandFolders keeps an already-open folder open (never collapses)', () => {
    const store = createOpenCollectionStore();
    store.dispatch(setPlaygroundCollection(withFolder()));
    store.dispatch(expandFolders(['f1']));
    expect(folder(store).isCollapsed).toBe(false);
  });
});
