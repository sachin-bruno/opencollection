import React, { useState, useEffect } from 'react';
import type { HttpRequest } from '@opencollection/types/requests/http';
import { StyledWrapper } from './StyledWrapper';
import MenuDropdown from '../../../../../../ui/MenuDropdown';
import HighlightedInput from '../../../../../../components/HighlightedInput/HighlightedInput';
import { VariableText } from '../../../../../../components/VariableText/VariableText';
import { useResolvedVariables } from '../../../../../../hooks';
import { getHttpMethod, getRequestUrl, getHttpParams } from '../../../../../../utils/schemaHelpers';
import { syncPathParams, syncQueryParams } from '../../../../../../utils/pathParams';
import { availableMethods, getMethodColorVar } from '../../../../../../theme/methodColors';

interface QueryBarProps {
  item: HttpRequest;
  onSendRequest: () => void;
  isLoading: boolean;
  onItemChange: (item: HttpRequest) => void;
}

const QueryBar: React.FC<QueryBarProps> = ({ item, onSendRequest, isLoading, onItemChange }) => {
  const [url, setUrl] = useState(getRequestUrl(item));
  const [method, setMethod] = useState(getHttpMethod(item));
  const { isFound, names, showVars } = useResolvedVariables();

  useEffect(() => {
    setUrl(getRequestUrl(item));
    setMethod(getHttpMethod(item));
  }, [item]);

  const handleSubmit = () => {
    if (url.trim() && !isLoading) onSendRequest();
  };

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);

    const currentParams = getHttpParams(item);
    const syncedParams = syncQueryParams(syncPathParams(currentParams, newUrl), newUrl);

    const updatedItem = {
      ...item,
      http: {
        ...item.http,
        url: newUrl,
        ...(syncedParams !== currentParams ? { params: syncedParams } : {})
      }
    };
    onItemChange(updatedItem);
  };

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    const updatedItem = {
      ...item,
      http: {
        ...item.http,
        method: newMethod
      }
    };
    onItemChange(updatedItem);
  };

  return (
    <StyledWrapper
      className="flex items-stretch"
      style={{
        height: '2.25rem'
      }}
    >
      <div className="method-select-wrapper">
        <MenuDropdown
          selectedItemId={method}
          placement="bottom-start"
          data-testid="query-bar-method-select"
          items={availableMethods.map((m) => ({
            id: m,
            label: <span style={{ color: getMethodColorVar(m) }}>{m}</span>,
            ariaLabel: m,
            onClick: () => handleMethodChange(m)
          }))}
        >
          <button
            type="button"
            className="method-select h-full"
            aria-label="HTTP method"
            style={{ color: getMethodColorVar(method) }}
          >
            {method}
          </button>
        </MenuDropdown>
      </div>

      {showVars ? (
        <div className="query-bar-url-resolved" data-testid="query-bar-url-resolved">
          <VariableText value={url} />
        </div>
      ) : (
        <HighlightedInput
          value={url}
          onValueChange={handleUrlChange}
          onSubmit={handleSubmit}
          isFound={isFound}
          names={names}
          placeholder="Enter request URL"
          testId="query-bar-url"
        />
      )}

      <button
        onClick={onSendRequest}
        disabled={isLoading || !url.trim()}
        className="send px-4 uppercase text-xs font-semibold text-white disabled:cursor-not-allowed flex items-center gap-2 transition-all"
      >
        {isLoading && (
          <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {isLoading ? 'Sending' : 'Send'}
      </button>
    </StyledWrapper>
  );
};

export default QueryBar;
