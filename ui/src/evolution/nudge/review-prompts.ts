/**
 * SecuClaw Evolution — Review Prompts
 * 
 * 对标 Hermes 的三种审查提示词 (run_agent.py:2862-2897)
 * 
 * 用于后台 Background Review 线程，让 LLM 分析对话历史
 * 决定是否需要保存记忆或创建/更新技能。
 */

export const REVIEW_PROMPTS = {
  /**
   * 记忆审查提示词
   * 对标 Hermes _MEMORY_REVIEW_PROMPT (run_agent.py:2862)
   */
  memory: [
    'Review the conversation above and consider saving to memory if appropriate.',
    '',
    'Focus on:',
    '1. Has the user revealed things about themselves — their persona, desires,',
    'preferences, or personal details worth remembering?',
    '2. Has the user expressed expectations about how you should behave, their work',
    'style, or ways they want you to operate?',
    '',
    'If something stands out, save it using the memory tool.',
    'If nothing is worth saving, just say \'Nothing to save.\' and stop.',
  ].join('\n'),

  /**
   * 技能审查提示词
   * 对标 Hermes _SKILL_REVIEW_PROMPT (run_agent.py:2876)
   */
  skill: [
    'Review the conversation above and consider saving or updating a skill if appropriate.',
    '',
    'Focus on: was a non-trivial approach used to complete a task that required trial',
    'and error, or changing course due to experiential findings along the way, or did',
    'the user expect or desire a different method or outcome?',
    '',
    'If a relevant skill already exists, update it with what you learned.',
    'Otherwise, create a new skill if the approach is reusable.',
    'If nothing is worth saving, just say \'Nothing to save.\' and stop.',
  ].join('\n'),

  /**
   * 组合审查提示词
   * 对标 Hermes _COMBINED_REVIEW_PROMPT (run_agent.py:2890)
   */
  combined: [
    'Review the conversation above and consider two things:',
    '',
    '**Memory**: Has the user revealed things about themselves — their persona,',
    'desires, preferences, or personal details? Has the user expressed expectations',
    'about how you should behave, their work style, or ways they want you to operate?',
    'If so, save using the memory tool.',
    '',
    '**Skills**: Was a non-trivial approach used to complete a task that required trial',
    'and error, or changing course due to experiential findings along the way, or did',
    'the user expect or desire a different method or outcome? If a relevant skill',
    'already exists, update it. Otherwise, create a new one if the approach is reusable.',
    '',
    'Only act if there\'s something genuinely worth saving.',
    'If nothing stands out, just say \'Nothing to save.\' and stop.',
  ].join('\n'),
} as const;

export type ReviewPromptType = keyof typeof REVIEW_PROMPTS;
