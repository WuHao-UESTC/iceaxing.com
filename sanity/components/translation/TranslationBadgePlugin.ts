import { definePlugin } from 'sanity';
import {
  translateZhBadge,
  translateEnBadge,
  translateDeBadge,
  translateProgressBadge,
} from './TranslationBadges';

export const translationBadgesPlugin = definePlugin({
  name: 'translation-badges',
  document: {
    badges: [translateZhBadge, translateEnBadge, translateDeBadge, translateProgressBadge],
  },
});
