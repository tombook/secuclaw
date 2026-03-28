import { linkResults, AiResult } from '../../../src/ai/result-linker';

describe('AI Result Linker', () => {
  test('maps references to URLs using custom resolver', () => {
    const results: AiResult[] = [
      { id: 'r1', text: 'Some analysis result', references: ['CVE-2023-1234', 'T1078'] },
    ];
    
    const resolver = (ref: string) => `https://secuclaw.example.com/references/${ref}`;
    const linked = linkResults(results, resolver);
    
    expect(linked[0].resolvedReferences?.length).toBe(2);
    expect(linked[0].resolvedReferences?.[0].id).toBe('CVE-2023-1234');
    expect(linked[0].resolvedReferences?.[0].url).toBe('https://secuclaw.example.com/references/CVE-2023-1234');
    expect(linked[0].resolvedReferences?.[1].id).toBe('T1078');
    expect(linked[0].resolvedReferences?.[1].url).toBe('https://secuclaw.example.com/references/T1078');
  });

  test('uses default URL resolver when not provided', () => {
    const results: AiResult[] = [
      { id: 'r2', text: 'Another result', references: ['ref-1'] },
    ];
    
    const linked = linkResults(results);
    
    expect(linked[0].resolvedReferences?.[0].url).toBe('https://docs.example.com/ref-1');
  });

  test('handles results without references', () => {
    const results: AiResult[] = [
      { id: 'r3', text: 'Result without references' },
    ];
    
    const linked = linkResults(results);
    
    expect(linked[0].resolvedReferences).toEqual([]);
  });

  test('preserves original result properties', () => {
    const results: AiResult[] = [
      { id: 'r4', text: 'Original text', references: ['ref-a'] },
    ];
    
    const linked = linkResults(results);
    
    expect(linked[0].id).toBe('r4');
    expect(linked[0].text).toBe('Original text');
    expect(linked[0].references).toEqual(['ref-a']);
  });
});
