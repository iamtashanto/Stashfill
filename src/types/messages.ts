import type { Profile as LegacyProfile } from './profile';
import type {
  Profile as VaultProfile,
  Card,
  Snippet,
  SiteRule,
  FieldMapping,
} from '../core/schemas/vault';
import type { PaymentCard } from './vault';

export type FillTarget =
  | { kind: 'profileField'; fieldPath: string; value: string }
  | { kind: 'entireProfile'; profile: VaultProfile | LegacyProfile }
  | { kind: 'paymentCard'; card: PaymentCard | Card };

export type ExtensionMessage =
  | { type: 'FILL_ACTIVE_FIELD'; target: FillTarget; targetElementId?: number }
  | {
      type: 'FILL_PAGE_FORM';
      profile: VaultProfile | LegacyProfile;
      mode?: 'all' | 'emptyOnly' | 'focusedOnly';
      siteRule?: SiteRule | null;
    }
  | { type: 'FILL_PAYMENT_CARD'; card: PaymentCard | Card; confirmed: boolean }
  | {
      type: 'REQUEST_CARD_FILL_CONFIRMATION';
      card: PaymentCard | Card;
      origin?: string;
    }
  | { type: 'UNDO_LAST_FILL' }
  | {
      type: 'OPEN_QUICK_PICKER';
      profiles: VaultProfile[];
      snippets: Snippet[];
      activeProfileId: string;
    }
  | {
      type: 'OPEN_SAVE_SELECTION_MODAL';
      selectedText: string;
      profiles: VaultProfile[];
      activeProfileId: string;
    }
  | {
      type: 'SAVE_SELECTION_TO_PROFILE';
      profileId: string;
      label: string;
      category: string;
      value: string;
    }
  | {
      type: 'START_MAP_FIELD_MODE';
      profiles: VaultProfile[];
      activeProfileId: string;
      targetElementId?: number;
    }
  | {
      type: 'SAVE_FIELD_MAPPING';
      host: string;
      mapping: FieldMapping;
    }
  | { type: 'VAULT_STATUS_QUERY' }
  | { type: 'VAULT_STATUS_RESPONSE'; isInitialized: boolean; isUnlocked: boolean }
  | { type: 'VAULT_LOCK' }
  | { type: 'GET_FOCUSED_INPUT_INFO' }
  | {
      type: 'FOCUSED_INPUT_INFO_RESPONSE';
      hasFocusedInput: boolean;
      fieldTypeGuess?: string;
    };
