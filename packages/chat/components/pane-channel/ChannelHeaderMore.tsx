import { ChannelMember } from 'api';
import clsx from 'clsx';
import { useMe } from 'common';
import { Edit } from 'icons';
import { FC, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import Icon from 'ui/Icon';
import { useMyChannelMember } from '../../hooks/useMyChannelMember';
import { ChannelHeaderCharacterNameEdit } from './ChannelHeaderCharacterNameEdit';
import { ChannelSettingsButton } from './ChannelSettingsButton';
import { MemberLeaveButton } from './MemberLeaveButton';

interface Props {
  channelId: string;
  resetHeaderState: () => void;
}

export const CharacterName: FC<{ member: ChannelMember; edit?: () => void }> = (
  { member, edit },
) => {
  return (
    <button
      onClick={edit}
      className={clsx('px-2 py-1 rounded', 'hover:bg-pin-brand-700/10')}
    >
      {member.characterName
        ? (
          <>
            <FormattedMessage defaultMessage="Character Name:" />
            {member.characterName}
          </>
        )
        : <FormattedMessage defaultMessage="No Character Name" />}
      <Icon icon={Edit} className="ml-1 text-brand-700" />
    </button>
  );
};

export const ChannelHeaderMore: FC<Props> = ({ channelId, resetHeaderState }) => {
  const me = useMe();
  const member = useMyChannelMember(channelId);
  const [uiState, setUiState] = useState<'DEFAULT' | 'EDIT_CHARACTER_NAME'>('DEFAULT');
  if (me === 'LOADING' || me == null || member === 'LOADING' || member == null) return null;
  if (uiState === 'EDIT_CHARACTER_NAME') {
    return (
      <div className="py-2 px-4 border-b flex gap-2">
        <ChannelHeaderCharacterNameEdit member={member.channel} exitEdit={() => setUiState('DEFAULT')} />
      </div>
    );
  }
  return (
    <div className="py-2 px-4 border-b flex gap-2">
      <div className="flex items-center gap-1 group">
        <CharacterName
          member={member.channel}
          edit={() => setUiState('EDIT_CHARACTER_NAME')}
        />
      </div>

      <MemberLeaveButton me={me} channelId={channelId} onSuccess={resetHeaderState} />
      {member.space.isAdmin && (
        <ChannelSettingsButton
          channelId={channelId}
        />
      )}
    </div>
  );
};
