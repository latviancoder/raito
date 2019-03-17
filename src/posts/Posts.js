import React, { useState } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { useAppContext } from '../App';
import { StyledHeading } from '../components/StyledHeading';

const StyledContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 300px;
  padding: 40px 0;
  background: #FCFBF7;
  border-right: 1px #f0f0f0 solid;
  display: flex;
  flex-direction: column;
  line-height: 36px;
  opacity: 1;
  transition: all .3s ease-in;
  ${props => props.noDisturb && css`
    transform: translateX(-300px) scale(2);
    opacity: 0;
  `}
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  border: 0;
  outline: none;
  background: #FCFBF7;
  padding: 0 40px;
  appearance: none;
  resize: none;
`;

const StyledPost = styled.div`
  cursor: pointer;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  ${props => props.selected && css`
    background: #F4F3EF;
  `}
  i {
    display: none;
  }
  &:hover i {
    display: block;
  }
`;

export default function Posts() {
  const [newPost, setNewPost] = useState('');
  const [state, dispatch] = useAppContext();

  return <StyledContainer noDisturb={state.noDisturb}>
    <StyledHeading>Posts</StyledHeading>
    {state.posts.length > 0 && <div>
      {state.posts.map(post => {
        return <StyledPost
          key={post.id}
          selected={state.selectedPostId === post.id}
          onClick={() => dispatch({ type: 'SELECT_POST', payload: post.id })}
        >
          <span>{post.label}</span>
          <i onClick={() => dispatch({ type: 'DELETE_POST', payload: post.id })}>-</i>
        </StyledPost>;
      })}
    </div>}
    <StyledTextarea
      placeholder=""
      value={newPost}
      onChange={e => setNewPost(e.target.value)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === 'Tab') && newPost.length > 0) {
          e.preventDefault();
          dispatch({ type: 'ADD_POST', payload: newPost });
          setNewPost('');
        }
      }}
    />
  </StyledContainer>;
}