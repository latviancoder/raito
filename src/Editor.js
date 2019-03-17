import React, { useEffect, useRef, useState } from 'react';
import styled from '@emotion/styled';
import { css } from '@emotion/core';
import Prism from 'prismjs';
import Plain from 'slate-plain-serializer';
import { Editor as SlateEditor } from 'slate-react';

import { useAppContext } from './App';

Prism.languages.markdown = Prism.languages.extend("markup", {});
Prism.languages.insertBefore("markdown", "prolog", {
  blockquote: { pattern: /^>(?:[\t ]*>)*/m, alias: "punctuation" },
  tilde: {
    pattern: /(^\s*)~\s.+/m,
    lookbehind: !0,
    alias: "important",
    inside: { punctuation: /^~|~$/ }
  },
  code: [
    { pattern: /^(?: {4}|\t).+/m, alias: "keyword" },
    {
      pattern: /``.+?``|`[^`\n]+`/,
      alias: "keyword"
    }
  ],
  title: [
    {
      pattern: /\w+.*(?:\r?\n|\r)(?:==+|--+)/,
      alias: "important",
      inside: { punctuation: /==+$|--+$/ }
    },
    {
      pattern: /(^\s*)#+.+/m,
      lookbehind: !0,
      alias: "important",
      inside: { punctuation: /^#+|#+$/ }
    }
  ],
  hr: { pattern: /(^\s*)([*-])([\t ]*\2){2,}(?=\s*$)/m, lookbehind: !0, alias: "punctuation" },
  list: { pattern: /(^\s*)(?:[*+-]|\d+\.)(?=[\t ].)/m, lookbehind: !0, alias: "punctuation" },
  "url-reference": {
    pattern: /!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:\\.|[^>\\])+>)(?:[\t ]+(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\)))?/,
    inside: {
      variable: { pattern: /^(!?\[)[^\]]+/, lookbehind: !0 },
      string: /(?:"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\((?:\\.|[^)\\])*\))$/,
      punctuation: /^[[]!:]|[<>]/
    },
    alias: "url"
  },
  bold: {
    pattern: /(^|[^\\])(\*\*|__)(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind: !0,
    inside: { punctuation: /^\*\*|^__|\*\*$|__$/ }
  },
  italic: {
    pattern: /(^|[^\\])([*_])(?:(?:\r?\n|\r)(?!\r?\n|\r)|.)+?\2/,
    lookbehind: !0,
    inside: { punctuation: /^[*_]|[*_]$/ }
  },
  url: {
    pattern: /!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:\\.|[^"\\])*")?\)| ?\[[^\]\n]*\])/,
    inside: {
      variable: { pattern: /(!?\[)[^\]]+(?=\]$)/, lookbehind: !0 },
      string: { pattern: /"(?:\\.|[^"\\])*"(?=\)$)/ }
    }
  }
});
Prism.languages.markdown.bold.inside.url = Prism.util.clone(Prism.languages.markdown.url);
Prism.languages.markdown.italic.inside.url = Prism.util.clone(Prism.languages.markdown.url);
Prism.languages.markdown.bold.inside.italic = Prism.util.clone(Prism.languages.markdown.italic);
Prism.languages.markdown.italic.inside.bold = Prism.util.clone(Prism.languages.markdown.bold);

const initialValue = Plain.deserialize(
  'Slate is flexible enough to add **decorations** that can format text based on its content. For example, this editor has **Markdown** preview decorations on it, to make it _dead_ simple to make an editor with built-in Markdown previewing.\n## Try it out!\nTry it out for yourself!'
);

const StyledContainer = styled.div`
  position: absolute;
  left: 600px;
  top: 0;
  bottom: 0;
  right: 0;
  padding: 50px 40px;
  transition: all .3s ease-out;
  ${props => props.noDisturb && css`
    transform: translateX(-200px);
  `}
`;

const decorateNode = (node, editor, next) => {
  const others = next() || [];
  if (node.object !== 'block') return others;

  const string = node.text;
  let texts = node.getTexts().toArray();
  const grammar = Prism.languages.markdown;
  const tokens = Prism.tokenize(string, grammar);
  const decorations = [];
  let startText = texts.shift();
  let endText = startText;
  let startOffset = 0;
  let endOffset = 0;
  let start = 0;

  function getLength(token) {
    if (typeof token === 'string') {
      return token.length;
    } else if (typeof token.content === 'string') {
      return token.content.length;
    } else {
      return token.content.reduce((l, t) => l + getLength(t), 0);
    }
  }

  for (const token of tokens) {
    startText = endText;
    startOffset = endOffset;

    const length = getLength(token);
    const end = start + length;

    let available = startText.text.length - startOffset;
    let remaining = length;

    endOffset = startOffset + remaining;

    while (available < remaining) {
      texts = texts.slice(1);
      endText = texts[0];
      remaining = length - available;
      available = endText.text.length;
      endOffset = remaining;
    }

    if (typeof token !== 'string') {
      const dec = {
        anchor: {
          key: startText.key,
          offset: startOffset,
        },
        focus: {
          key: endText.key,
          offset: endOffset,
        },
        mark: {
          type: token.type,
        },
      };

      decorations.push(dec);
    }

    start = end;
  }

  return [...others, ...decorations];
};

const renderMark = (props, editor, next) => {
  const { children, mark, attributes } = props;

  switch (mark.type) {
    case 'bold':
      return <strong {...attributes}>{children}</strong>;

    case 'code':
      return <code {...attributes}>{children}</code>;

    case 'italic':
      return <em {...attributes}>{children}</em>;

    case 'underlined':
      return <u {...attributes}>{children}</u>;

    case 'title': {
      return (
        <span
          {...attributes}
          style={{
            fontWeight: 'bold',
            fontSize: '20px',
            margin: '0',
            display: 'inline-block',
          }}
        >
            {children}
          </span>
      );
    }

    case 'punctuation': {
      return (
        <span {...attributes} style={{ opacity: 0.2 }}>
            {children}
          </span>
      );
    }

    case 'list': {
      return (
        <span
          {...attributes}
          style={{
            paddingLeft: '10px',
            lineHeight: '10px',
            fontSize: '20px',
          }}
        >
            {children}
          </span>
      );
    }

    case 'blockquote': {
      return (
        <span
          {...attributes}
          style={{
            paddingLeft: '5px',
            borderLeft: '2px #ddd solid'
          }}
        >
            {children}
          </span>
      );
    }

    case 'tilde': {
      return (
        <span
          {...attributes}
          style={{
            color: '#D0CDCA',
            fontWeight: 'bold',
          }}
        >
            {children}
          </span>
      );
    }

    case 'hr': {
      return (
        <span
          {...attributes}
          style={{
            borderBottom: '2px solid #000',
            display: 'block',
            opacity: 0.2,
          }}
        >
            {children}
          </span>
      );
    }

    default: {
      return next();
    }
  }
};

const StyledEditor = styled(SlateEditor)`
  height: 100vh;
  line-height: 23px;
`;

export default function Editor() {
  const prevBody = useRef();
  const [state, dispatch] = useAppContext();

  const selectedPost = state.posts[state.posts.findIndex(e => e.id === state.selectedPostId)] || {};

  const [body, setBody] = useState(() => {
    return Plain.deserialize(selectedPost.body || '');
  });

  useEffect(() => {
    if (prevBody.current && selectedPost.body !== Plain.serialize(prevBody.current)) {
      setBody(Plain.deserialize(selectedPost.body));
    }
  }, [selectedPost.body]);

  useEffect(() => {
    prevBody.current = body;

    const timeout = setTimeout(() => {
      dispatch({ type: 'UPDATE_BODY', payload: Plain.serialize(body) });
    }, 500);
    return () => clearTimeout(timeout);
  }, [body]);

  return <StyledContainer noDisturb={state.noDisturb}>
    <StyledEditor
      onKeyDown={(event, editor, next) => {
        if (event.altKey && event.key === 'a') {
          dispatch({ type: 'NO_DISTURB' });
        }
        if (event.key === 'Escape') {
          dispatch({ type: 'NO_DISTURB', payload: false });
        }

        const { value } = editor;
        const { selection } = value;
        const { startBlock } = value;
        const { start } = selection;

        next();
      }}
      value={body}
      autoCorrect={false}
      spellCheck={false}
      placeholder="Write some markdown..."
      defaultValue={body}
      renderMark={renderMark}
      decorateNode={decorateNode}
      onChange={({ value }) => {
        setBody(value);
      }}
    />
  </StyledContainer>;
}