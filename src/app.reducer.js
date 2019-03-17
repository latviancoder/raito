import produce from 'immer';
import uniqid from 'uniqid';

export function reducer(state, action) {
  switch (action.type) {
    case 'ADD_POST':
      return produce(state, draft => {
        const id = uniqid();

        draft.posts.push({
          id,
          body: '',
          label: action.payload.trim()
        });

        draft.selectedPostId = id;
      });

    case 'SELECT_POST':
      return produce(state, draft => {
        draft.selectedPostId = action.payload;
      });

    case 'DELETE_POST':
      return produce(state, draft => {
        draft.posts = draft.posts.filter(post => post.id !== action.payload);

        if (action.payload === state.selectedPostId) {
          if (draft.posts.length > 0) {
            draft.selectedPostId = draft.posts[draft.posts.length - 1].id;
          } else {
            delete draft.selectedPostId;
          }
        }
      });

    case 'ADD_BRAIN':
      return produce(state, draft => {
        const label = action.payload.trim();

        const selectedPostIndex = draft.posts.findIndex(e => e.id === state.selectedPostId);

        const body = draft.posts[selectedPostIndex].body;

        if (body.trim() === '' || body.endsWith('\n')) {
          draft.posts[selectedPostIndex].body += `~ ${label}\n\n`;
        } else {
          draft.posts[selectedPostIndex].body += `\n\n~ ${label}\n\n`;
        }
      });

    case 'UPDATE_BODY':
      return produce(state, draft => {
        const selectedPostIndex = draft.posts.findIndex(e => e.id === state.selectedPostId);
        draft.posts[selectedPostIndex].body = action.payload;
      });

    case 'NO_DISTURB':
      return produce(state, draft => {
        draft.noDisturb = action.payload ? action.payload : !draft.noDisturb;
      });

    default:
      return state;
  }
}