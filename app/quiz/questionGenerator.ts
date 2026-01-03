export interface GeneratedQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

/**
 * Get all questions and their answers for a specific module
 * @param moduleName - The name of the module to get questions for
 * @param count - Optional number of questions to return (random selection)
 * @returns Promise<GeneratedQuestion[]> - Array of questions with options
 */
export async function getQuestionsForModule(moduleName: string, count?: number): Promise<GeneratedQuestion[]> {
  try {
    const url = count 
      ? `/api/questions?module=${encodeURIComponent(moduleName)}&count=${count}`
      : `/api/questions?module=${encodeURIComponent(moduleName)}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.questions;
  } catch (error) {
    console.error(`Error fetching questions for module "${moduleName}":`, error);
    throw error;
  }
}

/**
 * Get a random selection of questions for a module
 * @param moduleName - The name of the module
 * @param count - Number of questions to return (default: 10)
 * @returns Promise<GeneratedQuestion[]> - Random selection of questions
 */
export async function getRandomQuestionsForModule(
  moduleName: string,
  count: number = 10
): Promise<GeneratedQuestion[]> {
  const allQuestions = await getQuestionsForModule(moduleName);

  // Shuffle and take the first 'count' questions
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, allQuestions.length));
}

/**
 * Get questions by difficulty for a module
 * @param moduleName - The name of the module
 * @param difficulty - Difficulty level ('easy', 'medium', 'hard')
 * @returns Promise<GeneratedQuestion[]> - Questions of specified difficulty
 */
export async function getQuestionsByDifficulty(
  moduleName: string,
  difficulty: 'easy' | 'medium' | 'hard'
): Promise<GeneratedQuestion[]> {
  // For now, get all questions and filter by difficulty
  // In a real implementation, this could be optimized with a separate API endpoint
  const allQuestions = await getQuestionsForModule(moduleName);
  return allQuestions.filter(q => {
    // This is a simplified approach - in a real app, difficulty would be stored with questions
    // For now, we'll just return all questions since our JSON doesn't have difficulty levels
    return true;
  });
}

/**
 * Get all available modules
 * @returns Promise<string[]> - Array of module names
 */
export async function getAvailableModules(): Promise<string[]> {
  // This would need a separate API endpoint in a real implementation
  // For now, return some default modules
  return ['Collaborative Web Project', 'Advanced Algorithms', 'Further Programming Paradigms', 'Artificial Intelligence'];
}
