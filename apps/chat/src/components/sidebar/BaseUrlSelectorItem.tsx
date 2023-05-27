import { Proxy } from 'api';
import clsx from 'clsx';
import { FC } from 'react';
import { FormattedMessage } from 'react-intl';
import { ProxyTestResult } from '../../hooks/useAutoSelectProxy';

interface Props {
  proxy: Proxy;
  result: ProxyTestResult['result'] | null | undefined;
  selected: boolean;
  setUrl: (url: string) => void;
}

export const BaseUrlSelectorItem: FC<Props> = ({ proxy, result, setUrl, selected }) => {
  const { url, name, region } = proxy;
  return (
    <button
      onClick={() => setUrl(url)}
      className={clsx(
        'flex items-center justify-between py-2 px-4 border-1/2 rounded-md',
        selected
          ? 'border-brand-400 bg-brand-100 hover:bg-brand-200'
          : 'border-surface-200 bg-surface-50 hover:bg-surface-200 hover:border-surface-300',
      )}
    >
      <div>
        <span className="text-lg">{name}</span>
        {region && <span className="ml-1 text-sm">({region})</span>}
      </div>
      <div className="text-right min-w-[6em]">
        {result == null && '...'}
        {result === 'FAILED' && (
          <span className="text-error-700">
            <FormattedMessage defaultMessage="Failed" />
          </span>
        )}
        {result === 'TIMEOUT' && <FormattedMessage defaultMessage="Timeout" />}
        {typeof result === 'number' && <span>{result.toFixed(2)} ms</span>}
      </div>
    </button>
  );
};
