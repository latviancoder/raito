import React, { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import styled from '@emotion/styled';
import { css, Global } from '@emotion/core';

import bgImage from './assets/bg2.jpg';
import Posts from './posts/Posts';
import BrainDump from './BrainDump';
import Editor from './Editor';
import { reducer } from './app.reducer';
import Plain from 'slate-plain-serializer';
import produce from 'immer';

const globalCss = css`
  * {
    box-sizing: border-box;
  }
  body {
    color: #696564;
    margin: 0;
    font-family: 'Merriweather', sans-serif;
    font-size: 15px;
    //font-family: 'PT Sans', sans-serif;
    //font-size: 17px;
  }
  textarea {
    font-family: 'Merriweather', sans-serif;
    font-size: 15px;
    line-height: 36px;
  }
`;

const StyledContainer = styled.main`
  position: relative;
  height: 100vh;
`;

const Bg = styled.div`
  position: fixed;
  z-index: -1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url(${bgImage});
  background-size: cover;
  background-position: bottom center;
  opacity: 0;
  transition: all 0.3s ease-out;
  ${props => props.noDisturb && css`opacity: 1`}
`;

const AppContext = createContext({});

export function useAppContext() {
  return useContext(AppContext);
}

let initialState = {
  posts: []
};

if (localStorage.getItem('state') !== null) {
  const savedState = JSON.parse(localStorage.getItem('state'));

  for (let post of savedState.posts) {
    post.body = post.body ? Plain.deserialize(post.body) : Plain.deserialize('') ;
  }

  initialState = {
    ...savedState
  };
}

function enchanceDispatchWithLogger(dispatch) {
  return function (action) {
    console.groupCollapsed('Action Type:', action.type);
    return dispatch(action);
  }
}

function useReducerWithLogger(...args) {
  let prevState = useRef(initialState);
  const [state, dispatch] = useReducer(...args);

  const dispatchWithLogger = useMemo(() => {
    return enchanceDispatchWithLogger(dispatch);
  }, [dispatch]);

  useEffect(() => {
    if (state !== initialState) {
      console.log('Prev state: ', prevState.current);
      console.log('Next state: ', state);
      console.groupEnd();
    }
    prevState.current = state;
  }, [state]);


  return [state, dispatchWithLogger];
}

function App() {
  const [state, dispatch] = useReducerWithLogger(reducer, initialState);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const toSave = produce(state, draft => {
        for (let post of draft.posts) {
          post.body = post.body ? Plain.serialize(post.body) : '';
        }
      });
      localStorage.setItem('state', JSON.stringify(toSave));
    }, 500);
    return () => clearTimeout(timeout);
  }, [state]);

  return <AppContext.Provider value={[state, dispatch]}>
    <StyledContainer>
      <Global styles={globalCss}/>
      <Bg noDisturb={state.noDisturb}/>
      <Posts/>
      {state.selectedPostId && (
        <>
          <BrainDump/>
          <Editor/>
        </>
      )}
    </StyledContainer>
  </AppContext.Provider>;
}

export default App;
