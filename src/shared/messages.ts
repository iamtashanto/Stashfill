import type { Profile } from '../core/schemas/vault';
import type { Card } from '../core/schemas/vault';

export type FillTarget =
  | { kind: 'profileField'; fieldPath: string; value: string }
  | { kind: 'entireProfile'; profile: Profile }
  | { kind: 'paymentCard'; card: Card };

export type ExtensionMessage =
  | { type: 'FILL_ACTIVE_FIELD'; target: FillTarget }
  | { type: 'FILL_PAGE_FORM'; profile: Profile }
  | { type: 'FILL_PAYMENT_CARD'; card: Card; confirmed: boolean }
  | { type: 'VAULT_STATUS_QUERY' }
  | { type: 'VAULT_STATUS_RESPONSE'; isInitialized: boolean; isUnlocked: boolean }
  | { type: 'VAULT_LOCK' }
  | { type: 'GET_FOCUSED_INPUT_INFO' }
  | {
      type: 'FOCUSED_INPUT_INFO_RESPONSE';
      hasFocusedInput: boolean;
      fieldTypeGuess?: string;
    }
  | { type: 'SCHEDULE_CLIPBOARD_CLEAR'; value: string; delayMs?: number };
