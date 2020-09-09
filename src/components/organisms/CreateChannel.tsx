import * as React from 'react';
import { useState } from 'react';
import { css } from '@emotion/core';
import { alignRight, breakpoint, largeInput, mediaQuery, mT, spacingN } from '../../styles/atoms';
import { CreateChannel as CreateChannelData } from '../../api/channels';
import { useForm } from 'react-hook-form';
import { AppError } from '../../api/error';
import DiceSelect, { DiceOption } from '../../components/molecules/DiceSelect';
import { useDispatch, useSelector } from '../../store';
import { RenderError } from '../molecules/RenderError';
import { Label } from '../atoms/Label';
import Input from '../../components/atoms/Input';
import { channelNameValidation, characterNameValidation } from '../../validators';
import { ErrorMessage } from '../atoms/ErrorMessage';
import { HelpText } from '../atoms/HelpText';
import Button from '../../components/atoms/Button';
import { post } from '../../api/request';
import { Space } from '../../api/spaces';
import { JoinedChannel } from '../../actions/profile';
import Dialog from '../../components/molecules/Dialog';

interface Props {
  space: Space;
  dismiss: () => void;
}

const panelStyle = css`
  width: ${spacingN(64)};
  ${mediaQuery(breakpoint.md)} {
    width: ${spacingN(80)};
  }
`;

interface FormData {
  name: string;
  characterName: string;
}

function CreateChannel({ space, dismiss }: Props) {
  const spaceId = space.id;
  const { register, handleSubmit, errors } = useForm<FormData>();
  const [editError, setEditError] = useState<AppError | null>(null);
  const [defaultDice, setDefaultDice] = useState<DiceOption | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const spaceMember = useSelector((state) => state.profile?.spaces.get(spaceId)?.member);
  const dispatch = useDispatch();
  if (!spaceMember || !spaceMember.isAdmin) {
    return (
      <Dialog title="没有权限" dismiss={dismiss} confirm={dismiss} confirmText="确认" mask>
        你没有创建新的频道的权限。
      </Dialog>
    );
  }
  const onSubmit = async ({ name, characterName }: FormData) => {
    const defaultDiceType = defaultDice?.value;
    const payload: CreateChannelData = { name, spaceId, defaultDiceType, characterName };
    setSubmitting(true);
    const result = await post('/channels/create', payload);
    setSubmitting(false);
    if (!result.isOk) {
      setEditError(result.value);
      return;
    }
    const { channel, member } = result.value;
    dispatch<JoinedChannel>({ type: 'JOINED_CHANNEL', channel, member });
    dismiss();
  };
  return (
    <Dialog title="创建频道" css={panelStyle} dismiss={dismiss} mask>
      {editError && <RenderError error={editError} variant="component" />}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Label htmlFor="name">频道名</Label>
          <Input css={largeInput} id="name" name="name" ref={register(channelNameValidation())} />
          {errors.name && <ErrorMessage>{errors.name.message}</ErrorMessage>}
        </div>
        <div>
          <Label htmlFor="defaultDiceType">默认骰子</Label>
          <DiceSelect
            id="defaultDiceType"
            name="defaultDiceType"
            defaultDiceType={space.defaultDiceType}
            value={defaultDice}
            onChange={setDefaultDice}
          />
          <HelpText>
            当输入 <code>1d20</code> 的时候可以简化成 <code>1d</code>。
          </HelpText>
        </div>
        <div>
          <Label htmlFor="characterName">角色名</Label>
          <Input
            id="characterName"
            name="characterName"
            placeholder="例如：KP"
            ref={register(characterNameValidation)}
          />
          {errors.characterName && <ErrorMessage>{errors.characterName.message}</ErrorMessage>}
        </div>
        <div css={[mT(4), alignRight]}>
          <Button data-variant="primary" disabled={submitting} type="submit">
            创建
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export default CreateChannel;
