import { makeId } from '@boluo/utils';
import { type Modifier, parseModifiers } from '../interpreter/parser';
import { type MediaError, validateMedia } from '../media';
import { type ComposeAction, type ComposeActionUnion } from './compose.actions';
import { type PreviewEdit } from '@boluo/api';

export type ComposeError = 'TEXT_EMPTY' | 'NO_NAME' | MediaError;

export type ComposeRange = [number, number];

export interface ComposeState {
  inputedName: string;
  previewId: string;
  source: string;
  media: File | string | null | undefined;
  whisperTo: // Represents whisper to the Game Master
  | null
    // Represents whisper to users (Game Master always can read all whisper messages)
    | string[]
    // Represents disabled whisper
    | undefined;
  focused: boolean;
  range: ComposeRange;
  backup?: ComposeState;
  edit: PreviewEdit | null;
}

export const makeInitialComposeState = (): ComposeState => ({
  inputedName: '',
  previewId: makeId(),
  source: '',
  media: null,
  range: [0, 0],
  focused: false,
  whisperTo: undefined,
  edit: null,
});

export const clearBackup = (state: ComposeState): ComposeState =>
  state.backup === undefined ? state : { ...state, backup: undefined };

const handleSetComposeSource = (
  state: ComposeState,
  action: ComposeAction<'setSource'>,
): ComposeState => {
  const { source } = action.payload;
  let { previewId } = state;
  if ((source === '' || state.source === '') && state.edit == null) {
    previewId = makeId();
  }
  return { ...state, source: action.payload.source, previewId };
};

const handleToggleInGame = (
  state: ComposeState,
  { payload }: ComposeAction<'toggleInGame'>,
): ComposeState => {
  const { source } = state;
  const { inGame: modifier } = parseModifiers(source);
  let nextSource;
  if (!modifier) {
    const startsWithSpace = source.startsWith(' ');
    const command = payload.defaultInGame ? '.out' : '.in';
    nextSource = (startsWithSpace ? command : `${command} `) + source;
  } else {
    const before = source.substring(0, modifier.start);
    const after = source.substring(modifier.start + modifier.len);
    const command = modifier.inGame ? '.out ' : '.in ';
    nextSource = command + (before + after).trimStart();
  }
  return { ...state, source: nextSource, range: [nextSource.length, nextSource.length] };
};

const handleSetInGame = (
  state: ComposeState,
  { payload }: ComposeAction<'setInGame'>,
): ComposeState => {
  const { source } = state;
  const { inGame: modifier } = parseModifiers(source);
  if (modifier !== false && modifier.inGame === payload.inGame) {
    return state;
  }
  let nextSource;
  if (!modifier) {
    const startsWithSpace = source.startsWith(' ');
    const command = payload.inGame ? '.in' : '.out';
    nextSource = (startsWithSpace ? command : `${command} `) + source;
  } else {
    const before = source.substring(0, modifier.start);
    const after = source.substring(modifier.start + modifier.len);
    const command = payload.inGame ? '.in ' : '.out ';
    nextSource = command + (before + after).trimStart();
  }
  return { ...state, source: nextSource, range: [nextSource.length, nextSource.length] };
};

const handleRecoverState = (
  state: ComposeState,
  action: ComposeAction<'recoverState'>,
): ComposeState => {
  return { ...action.payload, previewId: makeId(), media: null };
};

const handleAddDice = (
  state: ComposeState,
  { payload: { defaultRollCommand } }: ComposeAction<'addDice'>,
): ComposeState => {
  let { source } = state;
  let range = state.range;
  if (source.trim().length === 0) {
    source = `{${defaultRollCommand}} `;
    range = [source.length, source.length];
  } else if (!state.range) {
    source += ` {${defaultRollCommand}} `;
    range = [source.length, source.length];
  } else {
    const [a, b] = state.range;
    if (a === b) {
      const left = source.substring(0, a);
      const right = source.substring(a);
      source = `${left} {${defaultRollCommand}} `;
      range = [source.length, source.length];
      source += right;
    }
  }
  return { ...state, source, range };
};

const handleLink = (state: ComposeState, _: ComposeAction<'link'>): ComposeState => {
  let { source, range } = state;
  if (!range) {
    range = [source.length, source.length];
  }
  const [a, b] = range;

  const insertText = `[${source.substring(a, b)}]()`;
  const head = source.substring(0, a);
  const tail = source.substring(b);
  source = `${head}${insertText}${tail}`;
  return { ...state, source, range: [head.length + 1, head.length + insertText.length - 3] };
};

const handleBold = (state: ComposeState, _: ComposeAction<'bold'>): ComposeState => {
  let { source, range } = state;
  if (!range) {
    range = [source.length, source.length];
  }
  const [a, b] = range;

  const insertText = `**${source.substring(a, b)}**`;
  const head = source.substring(0, a);
  const tail = source.substring(b);
  source = `${head}${insertText}${tail}`;
  return { ...state, source, range: [head.length + 2, head.length + insertText.length - 2] };
};

const handleSetInputedName = (
  state: ComposeState,
  { payload }: ComposeAction<'setInputedName'>,
): ComposeState => {
  const inputedName = payload.inputedName.trim().slice(0, 32);
  const nextState = { ...state, inputedName };
  if (payload.setInGame) {
    return handleSetInGame(nextState, { type: 'setInGame', payload: { inGame: true } });
  } else {
    return nextState;
  }
};

const handleSetRange = (
  state: ComposeState,
  { payload: { range } }: ComposeAction<'setRange'>,
): ComposeState => {
  if (!range) {
    const end = state.source.length - 1;
    return { ...state, range: [end, end] };
  }
  if (range[0] > range[1]) {
    range = [range[1], range[0]];
  }
  const [a, b] = range;
  if (!state.range) {
    return { ...state, range };
  }
  if (state.range[0] === a && state.range[1] === b) {
    return state;
  }
  return { ...state, range };
};

const handleEditMessage = (
  state: ComposeState,
  { payload: { message } }: ComposeAction<'editMessage'>,
): ComposeState => {
  const { id: previewId, modified, text: source, inGame, name, mediaId, posP, posQ } = message;

  const inputedName = inGame ? name : '';
  const range: ComposeState['range'] = [source.length, source.length];

  return {
    ...makeInitialComposeState(),
    previewId,
    edit: { time: modified, p: posP, q: posQ },
    media: mediaId,
    source,
    inputedName,
    range,
    backup: clearBackup(state),
  };
};

const modifyModifier = (
  state: ComposeState,
  modifier: Modifier | false,
  command: string,
): ComposeState => {
  const { source } = state;
  let nextSource = source;
  if (!modifier) {
    const startsWithSpace = source.startsWith(' ');
    nextSource = (startsWithSpace ? command : `${command} `) + source;
  } else {
    const before = source.substring(0, modifier.start);
    const after = source.substring(modifier.start + modifier.len);
    nextSource = command + (before + after).trimStart();
  }
  return { ...state, source: nextSource, range: [nextSource.length, nextSource.length] };
};

const toggleModifier = (
  state: ComposeState,
  modifier: Modifier | false,
  command: string,
): ComposeState => {
  const { source } = state;
  let nextSource = source;
  if (!modifier) {
    const startsWithSpace = source.startsWith(' ');
    nextSource = (startsWithSpace ? command : `${command} `) + source;
  } else {
    const before = source.substring(0, modifier.start);
    const after = source.substring(modifier.start + modifier.len);
    nextSource = (before + after).trimStart();
  }
  return { ...state, source: nextSource, range: [nextSource.length, nextSource.length] };
};

const handleToggleBroadcast = (
  state: ComposeState,
  _: ComposeAction<'toggleBroadcast'>,
): ComposeState => {
  const { mute } = parseModifiers(state.source);
  return toggleModifier(state, mute, '.mute');
};

const handleToggleWhisper = (
  state: ComposeState,
  { payload: { username } }: ComposeAction<'toggleWhisper'>,
): ComposeState => {
  const { whisper } = parseModifiers(state.source);
  const command = username != null ? `.h(@${username})` : '.h';
  return toggleModifier(state, whisper, command);
};

const handleToggleAction = (
  state: ComposeState,
  _: ComposeAction<'toggleAction'>,
): ComposeState => {
  const { source } = state;
  const { action } = parseModifiers(source);
  return toggleModifier(state, action, '.me');
};

const handleSent = (
  state: ComposeState,
  { payload: { edit = false } }: ComposeAction<'sent'>,
): ComposeState => {
  if (edit && state.backup) {
    return state.backup;
  }
  const modifiers = parseModifiers(state.source);
  let source = '';
  if (modifiers.inGame) {
    source += modifiers.inGame.inGame ? '.in ' : '.out ';
  }
  if (modifiers.mute) {
    source += '.mute ';
  }
  if (modifiers.action) {
    source += '.me ';
  }
  return {
    ...state,
    previewId: makeId(),
    edit: null,
    range: [source.length, source.length],
    media: null,
    source,
  };
};

const handleMedia = (
  state: ComposeState,
  { payload: { media } }: ComposeAction<'media'>,
): ComposeState => ({
  ...state,
  media,
});

const handleFocus = (state: ComposeState, _: ComposeAction<'focus'>): ComposeState => ({
  ...state,
  focused: true,
});

const handleBlur = (state: ComposeState, _: ComposeAction<'blur'>): ComposeState => ({
  ...state,
  focused: false,
});

const handleReset = (
  state: ComposeState,
  { payload: { restore } }: ComposeAction<'reset'>,
): ComposeState => {
  if (restore === false) {
    return makeInitialComposeState();
  }
  if (restore === true && state.backup != null) {
    return state.backup;
  }
  if (state.edit != null && state.backup != null) {
    return state.backup;
  }
  return makeInitialComposeState();
};

const handleAddWhisperTarget = (
  state: ComposeState,
  { payload: { username } }: ComposeAction<'addWhisperTarget'>,
): ComposeState => {
  const { whisper } = parseModifiers(state.source);
  username = username.trim();
  if (username === '') {
    return state;
  }
  let mentionList = [username];
  if (whisper && !whisper.usernames.includes(username)) {
    mentionList = whisper.usernames.concat([username]);
  }
  const mentions = mentionList.map((u) => `@${u}`).join(' ');
  const modifiedModifier = `.h(${mentions})`;

  return modifyModifier(state, whisper, modifiedModifier);
};

const handleRemoveWhisperTarget = (
  state: ComposeState,
  { payload: { username } }: ComposeAction<'removeWhisperTarget'>,
): ComposeState => {
  const { whisper } = parseModifiers(state.source);
  if (!whisper) {
    return state;
  }
  const mentions = whisper.usernames
    .filter((u) => u !== username)
    .map((u) => `@${u}`)
    .join(' ');
  const modifiedModifier = `.h(${mentions})`;

  return modifyModifier(state, whisper, modifiedModifier);
};

export const handleCollided = (
  state: ComposeState,
  { payload: { previewId, newPreviewId } }: ComposeAction<'collided'>,
) => {
  if (previewId === state.previewId) {
    return { ...state, previewId: newPreviewId };
  } else {
    return state;
  }
};

export const composeReducer = (state: ComposeState, action: ComposeActionUnion): ComposeState => {
  switch (action.type) {
    case 'setSource':
      return handleSetComposeSource(state, action);
    case 'setInputedName':
      return handleSetInputedName(state, action);
    case 'toggleInGame':
      return handleToggleInGame(state, action);
    case 'setInGame':
      return handleSetInGame(state, action);
    case 'recoverState':
      return handleRecoverState(state, action);
    case 'collided':
      return handleCollided(state, action);
    case 'addDice':
      return handleAddDice(state, action);
    case 'link':
      return handleLink(state, action);
    case 'bold':
      return handleBold(state, action);
    case 'setRange':
      return handleSetRange(state, action);
    case 'editMessage':
      return handleEditMessage(state, action);
    case 'reset':
      return handleReset(state, action);
    case 'sent':
      return handleSent(state, action);
    case 'toggleAction':
      return handleToggleAction(state, action);
    case 'focus':
      return handleFocus(state, action);
    case 'media':
      return handleMedia(state, action);
    case 'blur':
      return handleBlur(state, action);
    case 'toggleWhisper':
      return handleToggleWhisper(state, action);
    case 'toggleBroadcast':
      return handleToggleBroadcast(state, action);
    case 'addWhisperTarget':
      return handleAddWhisperTarget(state, action);
    case 'removeWhisperTarget':
      return handleRemoveWhisperTarget(state, action);
  }
};

export const checkCompose =
  (characterName: string, defaultInGame: boolean) =>
  ({
    source,
    inputedName,
    media,
  }: Pick<ComposeState, 'source' | 'inputedName' | 'media'>): ComposeError | null => {
    const { inGame, rest } = parseModifiers(source);
    if (inGame ? inGame.inGame : defaultInGame) {
      if (inputedName.trim() === '' && characterName === '') {
        return 'NO_NAME';
      }
    }
    const mediaResult = validateMedia(media);
    if (mediaResult.isErr) {
      return mediaResult.err;
    }
    if (rest.trim() === '') {
      return 'TEXT_EMPTY';
    }
    return null;
  };
