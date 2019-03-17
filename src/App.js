import React, { createContext, useContext, useEffect, useReducer } from 'react';
import styled from '@emotion/styled';
import { css, Global } from '@emotion/core';
import { HotKeys } from 'react-hotkeys';

import bgImage from './assets/bg2.jpg';
import Posts from './posts/Posts';
import BrainDump from './BrainDump';
import Editor from './Editor';
import { reducer } from './app.reducer';

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
  initialState = JSON.parse(localStorage.getItem('state'));
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    localStorage.setItem('state', JSON.stringify(state));
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
