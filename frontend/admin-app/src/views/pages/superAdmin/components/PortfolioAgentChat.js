import React, { useState, useRef, useEffect, useLayoutEffect, useCallback, memo } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
  Chip,
  Tooltip,
  Fade,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import StopIcon from '@mui/icons-material/Stop';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';


const DEFAULT_MODEL = 'o4-mini';
const DEFAULT_EFFORT = 'low';
const DEEP_RESEARCH_MODEL = 'gpt-5.2';
const DEEP_RESEARCH_EFFORT = 'low';

const SUGGESTED_QUESTIONS = [
  'How many companies are in this portfolio?',
  'Which company has the highest ESG risk score?',
  'Compare growth scores across technology clusters',
  'What is the total patent count and who holds the most?'
];

const DRIP_INTERVAL_MS = 30;
const BASE_CHARS_PER_TICK = 2;
const MAX_CHARS_PER_TICK = 8;
const BUFFER_ACCELERATION = 200;
const SUGGESTIONS_OPEN_TAG = '<SUGGESTIONS>';
const SUGGESTIONS_CLOSE_TAG = '</SUGGESTIONS>';
const MAX_FOLLOW_UP_SUGGESTIONS = 3;

const findCompleteSuggestionMetadataStart = (text) => {
  const pattern = /(^|\n)[ \t]*<SUGGESTIONS>/g;
  let match;
  let start = -1;

  while ((match = pattern.exec(text)) !== null) {
    start = match.index;
  }

  return start;
};

const findPartialSuggestionMetadataStart = (text) => {
  const lineStart = text.lastIndexOf('\n');
  const suffixStart = lineStart === -1 ? 0 : lineStart + 1;
  const suffix = text.slice(suffixStart);
  const leadingWhitespaceLength = suffix.match(/^[ \t]*/)[0].length;
  const candidate = suffix.slice(leadingWhitespaceLength);

  if (candidate && SUGGESTIONS_OPEN_TAG.startsWith(candidate)) {
    return lineStart === -1 ? 0 : lineStart;
  }

  return -1;
};

const findSuggestionMetadataStart = (text) => {
  const completeStart = findCompleteSuggestionMetadataStart(text);
  if (completeStart !== -1) return completeStart;
  return findPartialSuggestionMetadataStart(text);
};

export const getStreamingDisplayContent = (text) => {
  if (!text) return '';

  const metadataStart = findSuggestionMetadataStart(text);
  if (metadataStart === -1) return text;

  return text.slice(0, metadataStart).trimEnd();
};

export const parseSuggestionMetadata = (text) => {
  if (!text) {
    return { content: '', suggestions: [] };
  }

  const metadataStart = findCompleteSuggestionMetadataStart(text);
  if (metadataStart === -1) {
    const partialStart = findPartialSuggestionMetadataStart(text);
    const partialLength = partialStart === -1
      ? 0
      : text.slice(partialStart).trim().length;

    if (partialLength > 1) {
      return { content: text.slice(0, partialStart).trimEnd(), suggestions: [] };
    }

    return { content: text, suggestions: [] };
  }

  const openIndex = text.indexOf(SUGGESTIONS_OPEN_TAG, metadataStart);
  if (openIndex === -1) {
    return { content: text.slice(0, metadataStart).trimEnd(), suggestions: [] };
  }

  const content = text.slice(0, metadataStart).trimEnd();
  const metadata = text.slice(openIndex + SUGGESTIONS_OPEN_TAG.length);
  const closeIndex = metadata.lastIndexOf(SUGGESTIONS_CLOSE_TAG);

  if (closeIndex === -1) {
    return { content, suggestions: [] };
  }

  let suggestions = [];
  try {
    const parsed = JSON.parse(metadata.slice(0, closeIndex).trim());
    if (Array.isArray(parsed)) {
      suggestions = parsed
        .filter(item => typeof item === 'string')
        .map(item => item.trim())
        .filter(Boolean)
        .slice(0, MAX_FOLLOW_UP_SUGGESTIONS);
    }
  } catch (err) {
    suggestions = [];
  }

  return { content, suggestions };
};

const skipPastTable = (buf, end, fullLen) => {
  const prevNl = buf.lastIndexOf('\n', end - 1);
  const curLineBegin = prevNl === -1 ? 0 : prevNl + 1;
  const lineSlice = buf.slice(curLineBegin, end).trim();

  if (!lineSlice.startsWith('|')) {
    return 0;
  }

  let scanPos = curLineBegin;
  while (scanPos < fullLen) {
    const nlPos = buf.indexOf('\n', scanPos);
    if (nlPos === -1) return -1;
    const nextLineStart = nlPos + 1;
    if (nextLineStart >= fullLen) return -1;
    const nextNl = buf.indexOf('\n', nextLineStart);
    const nextLine = nextNl === -1
      ? buf.slice(nextLineStart)
      : buf.slice(nextLineStart, nextNl);
    if (!nextLine.trim().startsWith('|')) {
      return nextLineStart;
    }
    scanPos = nextLineStart;
  }
  return -1;
};

const preprocessAiText = (text) => {
  if (!text) return '';
  let s = text;
  s = s.replace(/\s*\u2014\s*/g, ' - ');
  s = s.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) return line;
    line = line.replace(/([^\n])(• )/g, '$1\n$2');
    line = line.replace(/([^\n])(– )/g, '$1\n$2');
    line = line.replace(/([^\n])\s+(\d{1,2}\.\s+[A-Z"])/g, '$1\n$2');
    return line;
  }).join('\n');
  return s;
};

const formatInline = (text) => text
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:0.9em">$1</code>')
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const trimmed = url.trim();
    if (!/^https?:|^mailto:/i.test(trimmed)) return label;
    const safeHref = trimmed
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;');
    return `<a href="${safeHref}" target="_blank" rel="noopener noreferrer" style="color:#1976d2;text-decoration:underline">${label}</a>`;
  });

const formatMarkdown = (text) => {
  if (!text) return '';

  let html = preprocessAiText(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = html.split('\n');
  const result = [];
  let inTable = false;
  let inCodeBlock = false;
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        result.push('</code></pre>');
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
        result.push('<pre style="background:#f5f5f5;padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;margin:8px 0"><code>');
      }
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      if (line.replace(/[|\-\s:]/g, '').length === 0) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(line);
      continue;
    } else if (inTable) {
      result.push(renderTable(tableRows));
      inTable = false;
      tableRows = [];
    }

    let processed = line;

    if (/^#{1,6}\s/.test(processed)) {
      const level = processed.match(/^(#{1,6})\s/)[1].length;
      const text = processed.replace(/^#{1,6}\s+/, '');
      const sizes = { 1: '1.4em', 2: '1.25em', 3: '1.1em', 4: '1em', 5: '0.95em', 6: '0.9em' };
      processed = `<div style="font-weight:600;font-size:${sizes[level]};margin:12px 0 6px">${text}</div>`;
    } else {
      processed = formatInline(processed);

      if (/^\s*[•]\s/.test(processed)) {
        processed = `<div style="padding-left:16px;margin:4px 0">${processed}</div>`;
      } else if (/^\s*[–]\s/.test(processed)) {
        processed = `<div style="padding-left:32px;margin:3px 0">${processed.replace(/^\s*[–]\s+/, '&#9702; ')}</div>`;
      } else if (/^\s*[-*]\s/.test(processed)) {
        processed = `<div style="padding-left:16px;margin:4px 0">${processed.replace(/^\s*[-*]\s+/, '• ')}</div>`;
      } else if (/^\s*\d+\.\s/.test(processed)) {
        processed = `<div style="margin:14px 0 4px;font-weight:600">${processed}</div>`;
      }
    }

    result.push(processed);
  }

  if (inTable && tableRows.length > 0) {
    result.push(renderTable(tableRows));
  }
  if (inCodeBlock) {
    result.push('</code></pre>');
  }

  return result.join('\n');
};

const renderTable = (rows) => {
  if (rows.length === 0) return '';

  const parseRow = (row) =>
    row.split('|').slice(1, -1).map(cell => cell.trim());

  const headerCells = parseRow(rows[0]);
  const dataRows = rows.slice(1);

  let html = '<div style="overflow-x:auto;margin:8px 0"><table style="border-collapse:collapse;width:100%;font-size:13px">';
  html += '<thead><tr>';
  headerCells.forEach(cell => {
    html += `<th style="border:1px solid #e0e0e0;padding:8px 12px;background:#f5f5f5;font-weight:600;text-align:left;white-space:nowrap">${formatInline(cell)}</th>`;
  });
  html += '</tr></thead><tbody>';

  dataRows.forEach((row, idx) => {
    const cells = parseRow(row);
    const bg = idx % 2 === 0 ? '#fff' : '#fafafa';
    html += '<tr>';
    cells.forEach(cell => {
      html += `<td style="border:1px solid #e0e0e0;padding:6px 12px;background:${bg}">${formatInline(cell)}</td>`;
    });
    html += '</tr>';
  });

  html += '</tbody></table></div>';
  return html;
};

const ThinkingIndicator = memo(({ statusText }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 1 }}>
    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            opacity: 0.4,
            animation: 'portfolioAgentPulse 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes portfolioAgentPulse': {
              '0%, 80%, 100%': { opacity: 0.4, transform: 'scale(1)' },
              '40%': { opacity: 1, transform: 'scale(1.2)' }
            }
          }}
        />
      ))}
    </Box>
    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
      {statusText || 'Thinking...'}
    </Typography>
  </Box>
));

const CURSOR_BLINK_HTML = '<span style="display:inline-block;width:2px;height:1.1em;background:#1976d2;margin-left:3px;vertical-align:text-bottom;animation:portfolioAgentCursorBlink 1s step-end infinite"></span>';
const CURSOR_FADE_HTML = '<span style="display:inline-block;width:2px;height:1.1em;background:#1976d2;margin-left:3px;vertical-align:text-bottom;animation:portfolioAgentCursorFade 0.4s ease forwards"></span>';

const injectStreamingCursor = (html, cursorHtml) => {
  if (!html) return cursorHtml;
  const lastDiv = html.lastIndexOf('</div>');
  const lastCode = html.lastIndexOf('</code>');
  if (lastDiv >= 0 && lastDiv > lastCode) {
    return html.slice(0, lastDiv) + cursorHtml + html.slice(lastDiv);
  }
  if (lastCode >= 0) {
    return html.slice(0, lastCode) + cursorHtml + html.slice(lastCode);
  }
  return html + cursorHtml;
};

const MessageBubble = memo(({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const [cursorFading, setCursorFading] = useState(false);
  const prevStreamingRef = useRef(isStreaming);

  useLayoutEffect(() => {
    if (prevStreamingRef.current && !isStreaming) {
      setCursorFading(true);
      const timer = setTimeout(() => setCursorFading(false), 400);
      prevStreamingRef.current = isStreaming;
      return () => clearTimeout(timer);
    }
    prevStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const showCursor = isStreaming || cursorFading;

  return (
    <Box
      sx={{
        display: 'flex',
        mb: 2,
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start'
      }}
    >
      <Box sx={{ maxWidth: '80%' }}>
        <Paper
          elevation={0}
          sx={{
            px: 2.5,
            py: 1.5,
            borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            backgroundColor: isUser ? 'primary.main' : '#fff',
            color: isUser ? '#fff' : 'text.primary',
            border: isUser ? 'none' : '1px solid',
            borderColor: 'divider',
            '& table': { borderCollapse: 'collapse' },
            '& pre': { whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
            '& strong': { fontWeight: 600 },
            '@keyframes portfolioAgentCursorBlink': {
              '0%, 100%': { opacity: 1 },
              '50%': { opacity: 0 }
            },
            '@keyframes portfolioAgentCursorFade': {
              from: { opacity: 1 },
              to: { opacity: 0 }
            }
          }}
        >
          {isUser ? (
            <Typography variant="body1" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {message.content}
            </Typography>
          ) : (
            <Box
              sx={{
                lineHeight: 1.7,
                fontSize: '0.95rem',
                '& div': { lineHeight: 1.7 }
              }}
              dangerouslySetInnerHTML={{
                __html: showCursor
                  ? injectStreamingCursor(
                      formatMarkdown(message.content),
                      cursorFading ? CURSOR_FADE_HTML : CURSOR_BLINK_HTML
                    )
                  : formatMarkdown(message.content)
              }}
            />
          )}
        </Paper>
      </Box>
    </Box>
  );
});

const PortfolioAgentChat = ({ portfolioId }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [deepResearch, setDeepResearch] = useState(false);
  const [toolStatus, setToolStatus] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const conversationIdRef = useRef(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const contentRef = useRef('');
  const displayedLengthRef = useRef(0);
  const batchTimerRef = useRef(null);
  const statusQueueRef = useRef([]);
  const statusTimerRef = useRef(null);
  const statusShownAtRef = useRef(0);
  const currentStatusRef = useRef(null);
  const suggestionsFinalizedRef = useRef(false);

  useEffect(() => {
    conversationIdRef.current = currentConversationId;
  }, [currentConversationId]);

  const authHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { authorization: token } : {};
  }, []);

  const refreshConversations = useCallback(async () => {
    if (!portfolioId) return;
    try {
      const res = await fetch(
        `/api/v1/portfolio-agent/conversations?portfolioId=${portfolioId}`,
        { headers: authHeaders() }
      );
      if (!res.ok) {
        if (res.status === 404 || res.status === 403) {
          setConversations([]);
        }
        return;
      }
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  }, [portfolioId, authHeaders]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  const loadConversation = useCallback(async (conversationId) => {
    if (!conversationId || isLoading || isStreaming) return;
    setConversationLoading(true);
    try {
      const res = await fetch(
        `/api/v1/portfolio-agent/conversations/${conversationId}`,
        { headers: authHeaders() }
      );
      if (!res.ok) {
        if (res.status === 404) {
          setConversations(prev => prev.filter(c => c.id !== conversationId));
        }
        return;
      }
      const data = await res.json();
      const loaded = (data.messages || []).map((msg, idx) => ({
        id: `db-${msg.id}`,
        role: msg.role,
        content: msg.content,
        suggestions: idx === data.messages.length - 1
          && msg.role === 'assistant'
          ? [] : undefined
      }));
      setMessages(loaded);
      setCurrentConversationId(conversationId);
      contentRef.current = '';
      displayedLengthRef.current = 0;
      suggestionsFinalizedRef.current = false;
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setConversationLoading(false);
    }
  }, [authHeaders, isLoading, isStreaming]);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      const res = await fetch(
        `/api/v1/portfolio-agent/conversations/${conversationId}`,
        { method: 'DELETE', headers: authHeaders() }
      );
      if (!res.ok && res.status !== 404) {
        return;
      }
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (conversationIdRef.current === conversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  }, [authHeaders]);

  const MIN_STATUS_DISPLAY_MS = 2000;

  const drainStatusQueue = useCallback(() => {
    if (statusTimerRef.current) return;
    const queue = statusQueueRef.current;
    if (queue.length === 0) return;

    const next = queue.shift();
    setToolStatus(next);
    currentStatusRef.current = next;
    statusShownAtRef.current = Date.now();

    if (next === null) return;

    const scheduleNext = () => {
      statusTimerRef.current = null;
      if (statusQueueRef.current.length > 0) {
        drainStatusQueue();
      }
    };

    statusTimerRef.current = setTimeout(
      scheduleNext, MIN_STATUS_DISPLAY_MS
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      });
    }
  }, []);

  const finalizeAssistantSuggestions = useCallback((assistantMessageId) => {
    if (suggestionsFinalizedRef.current) return;

    const { content, suggestions } = parseSuggestionMetadata(contentRef.current);
    suggestionsFinalizedRef.current = true;
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.id === assistantMessageId) {
        return [...prev.slice(0, -1), { ...last, content, suggestions }];
      }
      return prev;
    });
    scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const handleStop = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    if (batchTimerRef.current) {
      clearInterval(batchTimerRef.current);
      batchTimerRef.current = null;
    }
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    statusQueueRef.current = [];
    currentStatusRef.current = null;
    setToolStatus(null);
    setIsStreaming(false);
    setIsLoading(false);
  }, []);

  const handleSend = useCallback(async (overrideText) => {
    const text = (overrideText || inputText).trim();
    if (!text || isLoading || isStreaming) return;

    const userMessage = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    const sentConversationId = conversationIdRef.current;
    const conversationMessages = [...messages, userMessage].map(({ role, content }) => ({
      role,
      content
    }));

    const assistantMessageId = (Date.now() + 1).toString();
    contentRef.current = '';
    displayedLengthRef.current = 0;
    suggestionsFinalizedRef.current = false;
    statusQueueRef.current = [];
    currentStatusRef.current = null;
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
      statusTimerRef.current = null;
    }

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/portfolio-agent/ask-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'authorization': token
        },
        body: JSON.stringify({
          portfolioId: parseInt(portfolioId, 10),
          conversationId: sentConversationId,
          messages: conversationMessages,
          effort: deepResearch ? DEEP_RESEARCH_EFFORT : DEFAULT_EFFORT,
          model: deepResearch ? DEEP_RESEARCH_MODEL : DEFAULT_MODEL
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let firstTokenReceived = false;
      let buffer = '';

      let streamDone = false;

      const dripInterval = setInterval(() => {
        const fullLen = contentRef.current.length;
        const shown = displayedLengthRef.current;
        if (shown < fullLen) {
          const pending = fullLen - shown;
          const t = Math.min(pending / BUFFER_ACCELERATION, 1);
          const chars = Math.round(
            BASE_CHARS_PER_TICK + t * (MAX_CHARS_PER_TICK - BASE_CHARS_PER_TICK)
          );
          let end = Math.min(shown + chars, fullLen);
          const buf = contentRef.current;

          const tableEnd = skipPastTable(buf, end, fullLen);
          if (tableEnd === -1) {
            if (streamDone) {
              end = fullLen;
            } else {
              return;
            }
          } else if (tableEnd > 0) {
            end = tableEnd;
          }

          const openBracket = buf.lastIndexOf('[', end - 1);
          if (openBracket >= shown) {
            const linkStart = buf.indexOf('](', openBracket);
            if (linkStart !== -1) {
              const urlStart = linkStart + 2;
              let depth = 1;
              let j = urlStart;
              const maxScan = Math.min(urlStart + 500, fullLen);
              while (j < maxScan && depth > 0) {
                if (buf[j] === '(') depth++;
                else if (buf[j] === ')') depth--;
                if (depth > 0) j++;
              }
              if (depth === 0 && j < maxScan) {
                end = j + 1;
              }
            }
          }
          const metadataStart = findSuggestionMetadataStart(buf);
          if (streamDone && metadataStart !== -1 && end >= metadataStart) {
            end = fullLen;
          }

          displayedLengthRef.current = end;
          if (streamDone && end === fullLen) {
            finalizeAssistantSuggestions(assistantMessageId);
          } else {
            const visibleContent = getStreamingDisplayContent(buf.slice(0, end));
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last && last.id === assistantMessageId) {
                return [...prev.slice(0, -1), { ...last, content: visibleContent }];
              }
              return prev;
            });
            scrollToBottom();
          }
        } else if (streamDone) {
          finalizeAssistantSuggestions(assistantMessageId);
          clearInterval(dripInterval);
          batchTimerRef.current = null;
          setIsStreaming(false);
          setIsLoading(false);
        }
      }, DRIP_INTERVAL_MS);
      batchTimerRef.current = dripInterval;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data) continue;

          try {
            const event = JSON.parse(data);

            if (event.type === 'conversation' && event.conversationId) {
              setCurrentConversationId(event.conversationId);
              conversationIdRef.current = event.conversationId;
              setConversations(prev => {
                const existingIdx = prev.findIndex(c => c.id === event.conversationId);
                if (existingIdx >= 0) {
                  const next = prev.slice();
                  next[existingIdx] = { ...next[existingIdx], lastModifiedAt: new Date().toISOString() };
                  next.sort((a, b) => new Date(b.lastModifiedAt) - new Date(a.lastModifiedAt));
                  return next;
                }
                return [{
                  id: event.conversationId,
                  title: event.title || 'New conversation',
                  portfolioId: parseInt(portfolioId, 10),
                  createdAt: new Date().toISOString(),
                  lastModifiedAt: new Date().toISOString()
                }, ...prev];
              });
            } else if (event.type === 'delta' && event.text) {
              if (!firstTokenReceived) {
                firstTokenReceived = true;
                setIsLoading(false);
                setIsStreaming(true);
                setMessages(prev => [...prev, {
                  id: assistantMessageId,
                  role: 'assistant',
                  content: ''
                }]);
              }
              contentRef.current += event.text;
            } else if (event.type === 'status' && event.text) {
              const sq = statusQueueRef.current;
              const lastQueued = sq.length > 0
                ? sq[sq.length - 1]
                : currentStatusRef.current;
              if (event.text !== lastQueued) {
                sq.push(event.text);
                drainStatusQueue();
              }
            } else if (event.type === 'done') {
              statusQueueRef.current.push(null);
              drainStatusQueue();
              refreshConversations();
            } else if (event.type === 'error') {
              throw new Error(event.message || 'Stream error');
            }
          } catch (parseErr) {
            if (parseErr.message && !parseErr.message.includes('JSON')) {
              throw parseErr;
            }
          }
        }
      }

      streamDone = true;

    } catch (err) {
      if (batchTimerRef.current) {
        clearInterval(batchTimerRef.current);
        batchTimerRef.current = null;
      }
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
      statusQueueRef.current = [];
      currentStatusRef.current = null;
      setToolStatus(null);

      if (err.name === 'AbortError') {
        setIsStreaming(false);
        setIsLoading(false);
        return;
      }

      console.error('Portfolio agent error:', err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Sorry, something went wrong: ${err.message}`
      }]);
      setIsStreaming(false);
      setIsLoading(false);
    }
  }, [inputText, isLoading, isStreaming, messages, portfolioId, deepResearch, scrollToBottom, drainStatusQueue, finalizeAssistantSuggestions, refreshConversations]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setInputText(suggestion);
    handleSend(suggestion);
  }, [handleSend]);

  const handleReset = useCallback(() => {
    if (isLoading || isStreaming) return;
    setMessages([]);
    setDeepResearch(false);
    setCurrentConversationId(null);
    conversationIdRef.current = null;
    contentRef.current = '';
    displayedLengthRef.current = 0;
    suggestionsFinalizedRef.current = false;
  }, [isLoading, isStreaming]);

  const showWelcome = messages.length === 0 && !isLoading;

  return (
    <Box
      data-testid="portfolio-agent-chat"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        height: 'calc(100vh - 140px)',
        maxWidth: 1200,
        mx: 'auto',
        width: '100%',
        gap: 2
      }}
    >
      <Box
        data-testid="portfolio-agent-conversations-panel"
        sx={{
          width: 260,
          flexShrink: 0,
          borderRight: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          flexDirection: 'column',
          pr: 1.5
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleReset}
          disabled={isLoading || isStreaming}
          data-testid="portfolio-agent-new-conversation"
          sx={{ mb: 1.5, justifyContent: 'flex-start' }}
        >
          New conversation
        </Button>
        <Box sx={{
          flex: 1,
          overflow: 'auto',
          scrollbarWidth: 'thin'
        }}>
          {conversations.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ px: 1.5, py: 1 }}
            >
              No saved conversations yet.
            </Typography>
          )}
          {conversations.map((conv) => {
            const active = conv.id === currentConversationId;
            return (
              <Box
                key={conv.id}
                data-testid={`portfolio-agent-conversation-row-${conv.id}`}
                onClick={() => loadConversation(conv.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.25,
                  py: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  cursor: (isLoading || isStreaming) ? 'default' : 'pointer',
                  opacity: (isLoading || isStreaming) ? 0.6 : 1,
                  backgroundColor: active ? 'primary.subtle' : 'transparent',
                  '&:hover': {
                    backgroundColor: active ? 'primary.subtle' : 'rgba(0,0,0,0.04)'
                  }
                }}
              >
                <ChatBubbleOutlineIcon
                  sx={{ fontSize: 16, color: active ? 'primary.main' : 'text.secondary' }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: active ? 600 : 400,
                    color: active ? 'primary.main' : 'text.primary'
                  }}
                  title={conv.title}
                >
                  {conv.title}
                </Typography>
                <Tooltip title="Delete conversation">
                  <span>
                    <IconButton
                      size="small"
                      data-testid={`portfolio-agent-conversation-delete-${conv.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isLoading || isStreaming) return;
                        setDeleteTarget(conv);
                      }}
                      disabled={isLoading || isStreaming}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            );
          })}
        </Box>
      </Box>
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0
      }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 2,
        pb: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AutoAwesomeIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Portfolio AI Agent
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ask questions about your portfolio companies
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          px: 1,
          pb: 2,
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' }
        }}
      >
        {showWelcome && (
          <Fade in timeout={400}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              textAlign: 'center',
              py: 8
            }}>
              <Box sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'primary.subtle',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 3
              }}>
                <AutoAwesomeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                Ask anything about your portfolio
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500 }}>
                The AI agent has access to all company data in this portfolio including
                ESG scores, growth metrics, funding, patents, emissions, and more.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', maxWidth: 600 }}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <Chip
                    key={q}
                    label={q}
                    variant="outlined"
                    onClick={() => handleSend(q)}
                    sx={{
                      cursor: 'pointer',
                      '&:hover': { backgroundColor: 'primary.subtle', borderColor: 'primary.main' },
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Fade>
        )}

        {messages.map((msg, idx) => {
          const showFollowUps = idx === messages.length - 1
            && msg.role === 'assistant'
            && !isLoading
            && !isStreaming
            && Array.isArray(msg.suggestions)
            && msg.suggestions.length > 0;

          return (
            <React.Fragment key={msg.id}>
              <MessageBubble
                message={msg}
                isStreaming={isStreaming && idx === messages.length - 1 && msg.role === 'assistant'}
              />
              {showFollowUps && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2, ml: 1, maxWidth: '80%' }}>
                  {msg.suggestions.map((suggestion) => (
                    <Chip
                      key={suggestion}
                      label={suggestion}
                      variant="outlined"
                      size="small"
                      onClick={() => handleSuggestionClick(suggestion)}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: '#fff',
                        '&:hover': { backgroundColor: 'primary.subtle', borderColor: 'primary.main' },
                        transition: 'all 0.2s'
                      }}
                    />
                  ))}
                </Box>
              )}
            </React.Fragment>
          );
        })}

        {isLoading && (
          <Box sx={{
            display: 'flex',
            mb: 2,
            alignItems: 'flex-start'
          }}>
            <Paper
              elevation={0}
              sx={{
                px: 2.5,
                py: 1.5,
                borderRadius: '16px 16px 16px 4px',
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <ThinkingIndicator statusText={toolStatus} />
            </Paper>
          </Box>
        )}
      </Box>

      <Box sx={{
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end'
        }}>
          <TextField
            inputRef={inputRef}
            fullWidth
            multiline
            maxRows={4}
            placeholder={isLoading || isStreaming
              ? 'Waiting for response...'
              : 'Ask about your portfolio companies...'}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || isStreaming}
            variant="outlined"
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: '#fff',
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                  borderWidth: 1.5
                }
              }
            }}
          />
          {isStreaming ? (
            <IconButton
              onClick={handleStop}
              sx={{
                backgroundColor: 'error.main',
                color: '#fff',
                width: 40,
                height: 40,
                '&:hover': { backgroundColor: 'error.dark' }
              }}
            >
              <StopIcon fontSize="small" />
            </IconButton>
          ) : (
            <IconButton
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              sx={{
                backgroundColor: 'primary.main',
                color: '#fff',
                width: 40,
                height: 40,
                '&:hover': { backgroundColor: 'primary.dark' },
                '&.Mui-disabled': {
                  backgroundColor: 'action.disabledBackground',
                  color: 'action.disabled'
                }
              }}
            >
              {isLoading
                ? <CircularProgress size={20} color="inherit" />
                : <SendIcon fontSize="small" />}
            </IconButton>
          )}
        </Box>
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mt: 0.75
        }}>
          <Tooltip
            title="Deep Research uses a more powerful model for deeper, multi-layered analysis. Responses typically take 2-5 minutes."
            placement="top"
            arrow
          >
            <Chip
              icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />}
              label="Deep Research"
              size="small"
              disabled={isLoading || isStreaming}
              onClick={() => setDeepResearch(prev => !prev)}
              variant={deepResearch ? 'filled' : 'outlined'}
              sx={{
                height: 28,
                fontSize: '0.875rem',
                fontWeight: deepResearch ? 600 : 400,
                cursor: (isLoading || isStreaming) ? 'default' : 'pointer',
                transition: 'all 0.2s',
                opacity: (isLoading || isStreaming) ? 0.4 : 1,
                borderColor: deepResearch
                  ? 'transparent'
                  : 'rgba(0,0,0,0.2)',
                backgroundColor: deepResearch
                  ? 'rgba(25, 118, 210, 0.12)'
                  : 'transparent',
                color: deepResearch
                  ? 'primary.main'
                  : 'text.secondary',
                '& .MuiChip-icon': {
                  color: deepResearch
                    ? 'primary.main'
                    : 'text.disabled'
                },
                '&:hover': {
                  backgroundColor: deepResearch
                    ? 'rgba(25, 118, 210, 0.18)'
                    : 'rgba(0,0,0,0.04)'
                },
                '&.Mui-disabled': {
                  opacity: 0.4,
                  color: deepResearch ? 'primary.main' : 'text.secondary',
                  borderColor: deepResearch ? 'transparent' : 'rgba(0,0,0,0.2)',
                  backgroundColor: deepResearch
                    ? 'rgba(25, 118, 210, 0.12)'
                    : 'transparent',
                  '& .MuiChip-icon': {
                    color: deepResearch ? 'primary.main' : 'text.disabled'
                  }
                }
              }}
            />
          </Tooltip>
          <Typography
            color="text.secondary"
            sx={{ fontSize: '13px' }}
          >
            Press Enter to send, Shift+Enter for new line
          </Typography>
        </Box>
        <Typography
          color="text.disabled"
          sx={{ fontSize: '13px', textAlign: 'center', mt: 1.5 }}
        >
          AI can make mistakes. Please double-check sources.
        </Typography>
      </Box>
      </Box>
      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        data-testid="portfolio-agent-delete-dialog"
      >
        <DialogTitle>Delete conversation?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {deleteTarget
              ? `“${deleteTarget.title}” and all its messages will be permanently deleted.`
              : ''}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            color="error"
            data-testid="portfolio-agent-delete-confirm"
            onClick={() => {
              const id = deleteTarget && deleteTarget.id;
              setDeleteTarget(null);
              if (id) deleteConversation(id);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      {conversationLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            right: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            background: '#fff',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            px: 2,
            py: 1,
            zIndex: 9999
          }}
        >
          <CircularProgress size={16} />
          <Typography variant="body2">Loading conversation…</Typography>
        </Box>
      )}
    </Box>
  );
};

export default memo(PortfolioAgentChat);
