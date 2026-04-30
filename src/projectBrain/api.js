import { supabase } from '../lib/supabase';

export async function askProjectBrain({ question, threadId = null }) {
  try {
    const { data, error } = await supabase.functions.invoke('project-brain-answer', {
      body: { question, threadId },
    });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error in askProjectBrain:', err);
    throw new Error('Project Brain is currently unavailable. Please try again later.');
  }
}
