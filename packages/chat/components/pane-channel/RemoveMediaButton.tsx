import { Trash } from 'icons';
import { useSetAtom } from 'jotai';
import { FC, useCallback } from 'react';
import { useComposeAtom } from '../../hooks/useComposeAtom';
import { Delay } from '../Delay';
import { FallbackIcon } from '../FallbackIcon';

export const RemoveMediaButton: FC = () => {
  const composeAtom = useComposeAtom();
  const dispatch = useSetAtom(composeAtom);
  const removeMedia = useCallback(() => {
    dispatch({ type: 'media', payload: { media: null } });
  }, [dispatch]);
  return (
    <button
      onClick={removeMedia}
      className="bg-surface-100 hover:border-surface-300 hover:bg-surface-50 rounded border p-2"
    >
      <Delay fallback={<FallbackIcon />}>
        <Trash />
      </Delay>
    </button>
  );
};
