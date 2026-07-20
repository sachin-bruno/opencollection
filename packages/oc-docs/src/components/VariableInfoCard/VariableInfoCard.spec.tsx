import React from 'react';
import { Provider } from 'react-redux';
import { describe, it, expect } from 'vitest';
import { createOpenCollectionStore } from '../../store/store';
import { setDocsCollection } from '../../store/slices/docs';
import { setPlaygroundCollection } from '../../store/slices/playground';
import { setActiveEnv } from '../../store/slices/env';
import { VariableResolverProvider, PlaygroundVariableResolverProvider } from '../../hooks';
import { useRenderToDom } from '../../hooks/useRenderToDom';
import { query } from '../../test-utils/dom';
import { VariableInfoCard } from './VariableInfoCard';

const collection: any = {
  request: {
    variables: [
      { name: 'apiVersion', value: '2024-01' },
      { name: 'profile', value: { type: 'object', data: { city: 'NYC', zip: 10001 } } }
    ]
  },
  config: {
    environments: [
      {
        name: 'Dev',
        variables: [
          { name: 'host', value: 'https://dev.test' },
          { name: 'endpoint', value: '{{host}}/v1' },
          { name: 'bearer_token', value: 'super-secret', secret: true },
          { name: 'emptyValue', value: '' }
        ]
      }
    ]
  }
};

const cardTree = (name: string) => {
  const store = createOpenCollectionStore();
  store.dispatch(setDocsCollection(collection));
  store.dispatch(setActiveEnv('Dev'));
  return (
    <Provider store={store}>
      <VariableResolverProvider>
        <VariableInfoCard name={name} />
      </VariableResolverProvider>
    </Provider>
  );
};

const selector = (suffix: string) => `[data-testid="variable-info-card-${suffix}"]`;

const part = (root: ReturnType<typeof useRenderToDom>, suffix: string) =>
  query(root, selector(suffix));

describe('VariableInfoCard', () => {
  it('shows name + scope badge + resolved value for an environment variable', () => {
    const root = useRenderToDom(cardTree('host'));
    expect(part(root, 'name').text).toBe('host');
    expect(part(root, 'scope').text).toBe('Environment');
    expect(part(root, 'value').text).toBe('https://dev.test');
  });

  it('labels a collection variable and resolves references recursively', () => {
    expect(part(useRenderToDom(cardTree('apiVersion')), 'scope').text).toBe('Collection');
    expect(part(useRenderToDom(cardTree('endpoint')), 'value').text).toBe('https://dev.test/v1');
  });

  it('shows a (Secret) placeholder with no reveal/copy and never prints the plaintext', () => {
    const root = useRenderToDom(cardTree('bearer_token'));
    expect(part(root, 'value').text).toBe('(Secret)');
    expect(root.toString()).not.toContain('super-secret');
    expect(root.querySelector(selector('reveal'))).toBeNull();
    expect(root.querySelector(selector('copy'))).toBeNull();
  });

  it('shows an (empty) placeholder with no copy control when the value is blank', () => {
    const root = useRenderToDom(cardTree('emptyValue'));
    expect(part(root, 'scope').text).toBe('Environment');
    expect(part(root, 'value').text).toBe('(empty)');
    expect(root.querySelector(selector('copy'))).toBeNull();
  });

  it('pretty-prints an object-typed value', () => {
    const value = part(useRenderToDom(cardTree('profile')), 'value').text;
    expect(JSON.parse(value)).toEqual({ city: 'NYC', zip: 10001 });
    expect(value).toContain('\n');
  });

  it('warns on an invalid variable name and shows no value', () => {
    const root = useRenderToDom(cardTree('bad name'));
    expect(root.querySelector(selector('warning'))).not.toBeNull();
    expect(root.querySelector(selector('value'))).toBeNull();
  });

  it('marks process.env as read-only', () => {
    const root = useRenderToDom(cardTree('process.env.HOME'));
    expect(part(root, 'scope').text).toBe('Process Env');
    expect(part(root, 'note').text).toBe('read-only');
  });

  it('notes a dynamic variable and shows no value', () => {
    const root = useRenderToDom(cardTree('$randomInt'));
    expect(part(root, 'scope').text).toBe('Dynamic');
    expect(part(root, 'note').text).toContain('random value');
    expect(root.querySelector(selector('value'))).toBeNull();
  });

  it('notes a time-based dynamic variable with the timestamp wording', () => {
    const root = useRenderToDom(cardTree('$timestamp'));
    expect(part(root, 'scope').text).toBe('Dynamic');
    expect(part(root, 'note').text).toContain('current timestamp');
  });

  it('warns on an unknown dynamic ($) function name', () => {
    const root = useRenderToDom(cardTree('$notAFunc'));
    expect(part(root, 'scope').text).toBe('Dynamic');
    expect(part(root, 'warning').text).toContain('Unknown dynamic variable');
    expect(root.querySelector(selector('note'))).toBeNull();
  });

  it('reports an undefined variable with a note', () => {
    const root = useRenderToDom(cardTree('nope'));
    expect(part(root, 'scope').text).toBe('Undefined');
    expect(part(root, 'note').text).toBe('Variable is not defined');
  });
});

const playgroundCardTree = (name: string) => {
  const store = createOpenCollectionStore();
  store.dispatch(setPlaygroundCollection(collection));
  store.dispatch(setActiveEnv('Dev'));
  return (
    <Provider store={store}>
      <PlaygroundVariableResolverProvider>
        <VariableInfoCard name={name} />
      </PlaygroundVariableResolverProvider>
    </Provider>
  );
};

describe('VariableInfoCard — playground (editable env vars)', () => {
  it('renders an editable input seeded with the RAW value (not the resolved one)', () => {
    const root = useRenderToDom(playgroundCardTree('endpoint'));
    // `endpoint` = "{{host}}/v1"; editing must target the raw reference, not "https://dev.test/v1".
    expect(part(root, 'input').getAttribute('value')).toBe('{{host}}/v1');
    expect(root.querySelector(selector('value'))).toBeNull();
  });

  it('still offers a copy button while editing an env var (edit and copy both work)', () => {
    const root = useRenderToDom(playgroundCardTree('host'));
    expect(root.querySelector(selector('input'))).not.toBeNull();
    expect(root.querySelector(selector('copy'))).not.toBeNull();
  });

  it('keeps a secret env var read-only — a (Secret) placeholder, no input', () => {
    const root = useRenderToDom(playgroundCardTree('bearer_token'));
    expect(root.querySelector(selector('input'))).toBeNull();
    expect(part(root, 'value').text).toBe('(Secret)');
    expect(root.toString()).not.toContain('super-secret');
  });

  it('does not make a collection-scoped variable editable', () => {
    const root = useRenderToDom(playgroundCardTree('apiVersion'));
    expect(root.querySelector(selector('input'))).toBeNull();
    expect(part(root, 'value').text).toBe('2024-01');
  });

  it('stays read-only under the docs (non-playground) provider', () => {
    const root = useRenderToDom(cardTree('host'));
    expect(root.querySelector(selector('input'))).toBeNull();
    expect(part(root, 'value').text).toBe('https://dev.test');
  });
});
