import type { Message, SpaceWithRelated } from 'api';
import type { Empty } from '../helper/type';

export type ActionMap = {
  receiveMessage: { channelId: string; message: Message };
  initialized: Empty;
  enterSpace: { spaceId: string };
  spaceUpdated: SpaceWithRelated;
  messagesLoaded: { messages: Message[]; before: number | null; channelId: string };
  connected: { connection: WebSocket; mailboxId: string };
  connecting: { mailboxId: string };
  connectionClosed: { mailboxId: string };
};

type MakeAction<ActionName> = ActionName extends keyof ActionMap ? {
    type: ActionName;
    payload: ActionMap[ActionName];
  }
  : never;

export type AppAction = MakeAction<keyof ActionMap>;

export type Action<T extends keyof ActionMap> = MakeAction<T>;

export function makeAction<A extends AppAction>(type: A['type'], payload: A['payload']): A {
  const action = {
    type,
    payload,
  } as A;
  return action;
}
