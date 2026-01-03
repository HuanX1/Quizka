import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface QuizData {
  modules: {
    id: number;
    name: string;
    description: string;
  }[];
  questions: {
    id: number;
    module_id: number;
    question_text: string;
    question_type: string;
    difficulty: string;
    answers: {
      text: string;
      is_correct: boolean;
    }[];
  }[];
}

// Cache for quiz data
let quizData: QuizData | null = null;

/**
 * Clear the quiz data cache
 */
export function clearModulesDataCache() {
  quizData = null;
}

/**
 * Load quiz data from JSON file
 */
function loadQuizData(): QuizData {
  if (!quizData) {
    const dataPath = path.join(process.cwd(), 'data', 'quiz-data.json');
    const data = fs.readFileSync(dataPath, 'utf-8');
    quizData = JSON.parse(data);
  }
  return quizData!;
}

/**
 * GET /api/modules
 * Returns modules with question counts
 */
export async function GET(request: NextRequest) {
  try {
    const data = loadQuizData();

    const modulesWithCounts = data.modules.map(module => {
      const questionCount = data.questions.filter(q => q.module_id === module.id).length;
      return {
        ...module,
        questionCount
      };
    });

    return NextResponse.json({ modules: modulesWithCounts });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}