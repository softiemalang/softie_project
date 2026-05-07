import { supabase } from '../lib/supabase';

const PROJECT_BRAIN_DISABLED = true;

export async function askProjectBrain({ question, threadId = null }) {
  if (PROJECT_BRAIN_DISABLED) {
    return {
      answer: 'Project Brain은 현재 비활성화되어 있어요.',
      citations: [],
      threadId,
      warning: 'Project Brain is disabled.',
    };
  }

  const { data, error } = await supabase.functions.invoke('project-brain-answer', {
    body: { question, threadId },
  });

  if (error) {
    console.error('Supabase function error:', error);
    throw new Error(error.message || 'Project Brain is currently unavailable.');
  }

  return {
    answer: data.answer || 'No answer received.',
    citations: data.citations || [],
    threadId: data.threadId || null,
    warning: data.warning || null,
  };
}
