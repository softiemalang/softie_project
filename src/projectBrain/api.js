import { supabase } from '../lib/supabase';

export async function askProjectBrain({ question, threadId = null }) {
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
    threadId: data.threadId || null
  };
}
