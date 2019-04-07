import produce from 'immer';
import uniqid from 'uniqid';

export function reducer(state, action) {
  switch (action.type) {
    case 'ADD_POST':
      return produce(state, draft => {
        const id = uniqid();

        draft.posts.push({
          id,
          label: action.payload.trim()
        });

        draft.selectedPostId = id;
      });

    case 'SELECT_POST':
      return produce(state, draft => {
        draft.selectedPostId = action.payload.selectedPostId;
        draft.immediate = action.payload.immediate;
      });

    case 'DELETE_POST':
      return produce(state, draft => {
        draft.posts = draft.posts.filter(post => post.id !== action.payload);

        if (action.payload === state.selectedPostId) {
          if (draft.posts.length > 1) {
            draft.selectedPostId = draft.posts[draft.posts.length - 1].id;
          } else {
            delete draft.selectedPostId;
          }
        }
      });

    case 'UPDATE_BODY':
      return produce(state, draft => {
        const selectedPost = draft.posts.find(e => e.id === state.selectedPostId);
        selectedPost.body = action.payload.body;
        draft.immediate = action.payload.immediate;
      });

    case 'NO_DISTURB':
      return produce(state, draft => {
        draft.noDisturb = action.payload ? action.payload : !draft.noDisturb;
      });

    default:
      return state;
  }
}