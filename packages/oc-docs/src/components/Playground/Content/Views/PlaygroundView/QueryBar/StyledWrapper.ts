import styled from '@emotion/styled';

export const StyledWrapper = styled.div`
  border: 0.0625rem solid var(--border-color);
  border-radius: var(--oc-radius);
  overflow: hidden;
  transition: border-color 0.25s cubic-bezier(0.4, 0, 0.2, 1),
              box-shadow 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: var(--bg-primary);

  &:focus-within {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.1875rem color-mix(in srgb, var(--oc-brand) 10%, transparent),
                0 0.0625rem 0.125rem color-mix(in srgb, var(--oc-text) 5%, transparent);
  }

  input {
    outline: none;
    background-color: transparent;
    color: var(--text-primary);
    border-radius: 0;
    border: none;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    
    &::placeholder {
      color: var(--text-secondary);
      opacity: 0.6;
      transition: opacity 0.2s ease;
    }
    
    &:focus::placeholder {
      opacity: 0.45;
    }
    
    &:focus {
      background-color: color-mix(in srgb, var(--oc-text) 1%, transparent);
    }
  }

  .highlight-input {
    flex: 1;
    min-width: 0;
    font-family: var(--font-mono);
  }

  .highlight-input .text-input,
  .highlight-input .highlight-input-mirror {
    font-size: var(--oc-font-size-sm);
  }

  .highlight-input .variable-valid,
  .highlight-input .variable-invalid,
  .highlight-input .variable-prompt {
    color: var(--primary-text);
    background-color: var(--brand-soft);
    border-radius: 0.1875rem;
  }

  .query-bar-url-resolved {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    padding: 0 0.625rem;
    overflow-x: auto;
    white-space: nowrap;
    font-family: var(--font-mono);
    font-size: var(--oc-font-size-sm);
    color: var(--text-primary);
    scrollbar-width: none;
  }

  .query-bar-url-resolved::-webkit-scrollbar {
    display: none;
  }

  .method-select-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .method-select {
    appearance: none;
    display: inline-flex;
    align-items: center;
    margin: 0;
    font-family: inherit;
    line-height: 1;
    background-color: transparent;
    border: none;
    outline: none;
    cursor: pointer;
    padding: 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  button.send {
    background-color: var(--primary-color);
    font-size: var(--oc-font-size-xs);
    font-weight: 600;
    letter-spacing: 0.01em;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 0.0625rem;
      background: color-mix(in srgb, var(--oc-text) 8%, transparent);
    }

    &:hover:not(:disabled) {
      background-color: color-mix(in srgb, var(--oc-brand) 85%, black);
    }
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;