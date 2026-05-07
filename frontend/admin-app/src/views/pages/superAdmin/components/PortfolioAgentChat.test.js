import {
  getStreamingDisplayContent,
  parseSuggestionMetadata
} from './PortfolioAgentChat';

describe('portfolio agent suggestion metadata', () => {
  it('strips a valid suggestion block and returns up to three suggestions', () => {
    const result = parseSuggestionMetadata(
      'Here is the answer.\n<SUGGESTIONS>["Compare the top risks", "Show companies by growth", "Find patent leaders", "Extra"]</SUGGESTIONS>'
    );

    expect(result).toEqual({
      content: 'Here is the answer.',
      suggestions: [
        'Compare the top risks',
        'Show companies by growth',
        'Find patent leaders'
      ]
    });
  });

  it('strips malformed suggestion metadata without throwing', () => {
    const result = parseSuggestionMetadata(
      'Answer text.\n<SUGGESTIONS>not-json</SUGGESTIONS>'
    );

    expect(result).toEqual({
      content: 'Answer text.',
      suggestions: []
    });
  });

  it('does not treat mid-line literal tags as metadata', () => {
    const content = 'The literal <SUGGESTIONS> tag can appear in documentation.';

    expect(parseSuggestionMetadata(content)).toEqual({
      content,
      suggestions: []
    });
    expect(getStreamingDisplayContent(content)).toBe(content);
  });

  it('hides complete and partial metadata tags while streaming', () => {
    expect(getStreamingDisplayContent('Answer\n<SUGGESTIONS>["Next?"]')).toBe('Answer');
    expect(getStreamingDisplayContent('Answer\n<SUG')).toBe('Answer');
  });
});
