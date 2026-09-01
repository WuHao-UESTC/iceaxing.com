import { definePlugin } from 'sanity';
import { DuplicateAction } from './DuplicateAction';
import { QuickMoveAction } from './QuickMoveAction';

export const blogActionsPlugin = definePlugin({
  name: 'blog-document-actions',
  document: {
    actions: [DuplicateAction, QuickMoveAction],
  },
});
