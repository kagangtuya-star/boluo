import clsx from 'clsx';
import { MasksTheater } from 'icons';
import { useAtomValue, useSetAtom } from 'jotai';
import { selectAtom } from 'jotai/utils';
import { FC, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'ui/Button';
import { useComposeAtom } from '../../hooks/useComposeAtom';
import { makeComposeAction } from '../../state/actions/compose';

interface Props {
  iconOnly?: boolean;
}

export const InGameSwitchButton: FC<Props> = ({ iconOnly = false }) => {
  const composeAtom = useComposeAtom();
  const inGame = useAtomValue(useMemo(() => selectAtom(composeAtom, (compose) => compose.inGame), [composeAtom]));
  const dispatch = useSetAtom(composeAtom);
  return (
    <Button
      data-type="switch"
      data-on={inGame}
      onClick={() => dispatch(makeComposeAction('toggleInGame', {}))}
    >
      <MasksTheater />
      <span className={clsx('hidden', !iconOnly && '@md:inline')}>
        <FormattedMessage defaultMessage="In Game" />
      </span>
    </Button>
  );
};
