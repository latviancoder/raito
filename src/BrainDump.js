import React, { useEffect, useMemo, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import produce from 'immer';

import { useAppContext } from './App';
import { reorder } from './helpers';
import { StyledHeading } from './components/StyledHeading';

const StyledContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 300px;
  width: 300px;
  padding: 40px 0;
  border-right: 1px #f0f0f0 solid;
  display: flex;
  flex-direction: column;
  background: #FFFEFA;
  line-height: 36px;
  transition: all .3s cubic-bezier(0.290, 0.710, 0.380, 0.920);
  ${props => props.noDisturb && css`
    transform: translateX(-300px);
    background: transparent;
    border-right: none;
  `}
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  border: 0;
  outline: none;
  background: #FFFEFA;
  color: #696564;
  padding: 0 40px;
  transition: all .15s cubic-bezier(0.290, 0.710, 0.380, 0.920);
  appearance: none;
  resize: none;
  ${props => props.noDisturb && css`
    background: transparent;
  `}
`;

const getListStyle = isDraggingOver => ({
  // background: isDraggingOver ? 'lightblue' : 'lightgrey',
});

const StyledTest = styled.div`
  user-select: none;
  background: ${props => props.isDragging ? '#fef8e1' : 'transparent'};
  padding: 0 40px;
`;

export default function BrainDump() {
  const textareaRef = useRef(null);
  const [newBrainDump, setNewBrainDump] = useState('');
  const [brainDumps, setBrainDumps] = useState(null);

  const [state, dispatch] = useAppContext();

  const selectedPost = useMemo(() => {
    return state.posts[state.posts.findIndex(e => e.id === state.selectedPostId)];
  }, [state.posts, state.selectedPostId]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [state.selectedPostId]);

  useEffect(() => {
    if (state.selectedPostId) {
      const selectedPost = state.posts.find(e => e.id === state.selectedPostId);

      let matches = selectedPost.body.match(/^~\s+[\S ]+$/mg);

      if (matches) {
        setBrainDumps(matches.map(e => e.replace(/^~\s+/, '')));
      } else {
        setBrainDumps([]);
      }
    }
  }, [state.posts, state.selectedPostId]);

  return <StyledContainer noDisturb={state.noDisturb}>
    <StyledHeading>Brain dump</StyledHeading>
    {brainDumps && <DragDropContext onDragEnd={(result) => {
      if (!result.destination || result.destination.index === result.source.index) {
        return;
      }

      const { body } = selectedPost;
      const allTildes = body.match(/^~\s+[\S ]+$/mg);
      const allContents = body.split(/^~\s+[\S ]+$/mg);

      const updatedTildes = produce(allTildes, draft => {
        reorder(draft, result.source.index, result.destination.index);
      });

      const updatedBrainDumps = produce(brainDumps, draft => {
        reorder(draft, result.source.index, result.destination.index);
      });

      const updatedContents = produce(allContents, draft => {
        reorder(draft, result.source.index + 1, result.destination.index + 1);
      });

      let updatedBody = '';
      updatedContents.forEach((content, i) => {
        updatedBody += content.trim();
        if (updatedTildes[i]) {
          updatedBody += `\n\n${updatedTildes[i]}\n\n`;
        }
      });

      setBrainDumps(updatedBrainDumps);
      dispatch({ type: 'UPDATE_BODY', payload: updatedBody.trim() });
    }}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            style={getListStyle(snapshot.isDraggingOver)}
          >
            {brainDumps.map((label, index) => (
              <Draggable key={`${label}-${index}`} draggableId={`${label}-${index}`} index={index}>
                {(provided, snapshot) => (
                  <StyledTest
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    isDragging={snapshot.isDragging}
                    style={provided.draggableProps.style}
                  >
                    {label}
                  </StyledTest>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>}
    <StyledTextarea
      noDisturb={state.noDisturb}
      ref={textareaRef}
      value={newBrainDump}
      onChange={e => setNewBrainDump(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && newBrainDump.length > 0) {
          e.preventDefault();
          dispatch({ type: 'ADD_BRAIN', payload: newBrainDump });
          setNewBrainDump('');
        }
      }}
    />
  </StyledContainer>;
}