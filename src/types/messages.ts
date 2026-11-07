import type { Profile as LegacyProfile } from './profile';
import type { Profile as VaultProfile, Card } from '../core/schemas/vault';
import type { PaymentCard } from './vault';

export type FillTarget =
  | { kind: 'profileField'; fieldPath: string; value: string }
  | { kind: 'entireProfile'; profile: VaultProfile | LegacyProfile }
  | { kind: 'paymentCard'; card: PaymentCard | Card };

export type ExtensionMessage =
  | { type: 'FILL_ACTIVE_FIELD'; target: FillTarget }
  | { type: 'FILL_PAGE_FORM'; profile: VaultProfile | LegacyProfile }
  | { type: 'FILL_PAYMENT_CARD'; card: PaymentCard | Card; confirmed: boolean }
  | { type: 'VAULT_STATUS_QUERY' }
  | { type: 'VAULT_STATUS_RESPONSE'; isInitialized: boolean; isUnlocked: boolean }
  | { type: 'VAULT_LOCK' }
  | { type: 'GET_FOCUSED_INPUT_INFO' }
  | {
      type: 'FOCUSED_INPUT_INFO_RESPONSE';
      hasFocusedInput: boolean;
      fieldTypeGuess?: string;
    };
