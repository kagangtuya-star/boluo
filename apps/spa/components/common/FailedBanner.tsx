import { type FC, type ReactNode, useState } from 'react';
import { ErrorDisplay } from '../ErrorDisplay';
import { Button } from '@boluo/ui/Button';
import { FormattedMessage } from 'react-intl';
import { useBannerNode } from '../../hooks/useBannerNode';
import ReactDOM from 'react-dom';
import { AlertCircle } from '@boluo/icons';

// 添加 findDOMNode 兼容性补丁
// if (typeof ReactDOM.findDOMNode === 'undefined') {
//   ReactDOM.findDOMNode = function findDOMNode(component) {
//     return (
//       component &&
//       (component.nodeType === 1 ? component : ReactDOM.findDOMNode(component.render?.()))
//     );
//   };
// }

interface Props {
  icon?: ReactNode;
  error?: unknown;
  children: ReactNode;
  onDismiss?: () => void;
}

export const FailedBanner: FC<Props> = ({ icon, error, children, onDismiss }) => {
  const [show, setShow] = useState(true);
  const banner = useBannerNode();
  const handleDismiss = () => {
    setShow(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  if (!show || !banner) return null;
  return ReactDOM.createPortal(
    <div className="bg-failed-banner-bg border-failed-banner-border flex items-center gap-2 border-y px-3 py-2">
      <span className="text-text-lighter">{icon ?? <AlertCircle />}</span>
      {children}

      {error != null ? (
        <div className="text-text-lighter flex-grow text-sm">
          <ErrorDisplay error={error} />
        </div>
      ) : (
        <div className="flex-grow" />
      )}
      <Button data-small onClick={handleDismiss}>
        <FormattedMessage defaultMessage="Dismiss" />
      </Button>
    </div>,
    banner,
  );
};
