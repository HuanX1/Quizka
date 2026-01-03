import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface GeneratedQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

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
export function clearQuizDataCache() {
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
 * Get all questions and their answers for a specific module
 */
function getQuestionsForModule(moduleName: string): GeneratedQuestion[] {
  const data = loadQuizData();

  // Find the module
  const module = data.modules.find(m => m.name === moduleName);
  if (!module) {
    console.warn(`Module "${moduleName}" not found`);
    return [];
  }

  // Get questions for this module
  const moduleQuestions = data.questions.filter(q => q.module_id === module.id);

  // Convert to GeneratedQuestion format
  const generatedQuestions: GeneratedQuestion[] = moduleQuestions.map(q => {
    // Find the index of the correct answer
    const correctAnswerIndex = q.answers.findIndex(a => a.is_correct);

    if (correctAnswerIndex === -1) {
      console.warn(`Question ${q.id} has no correct answer`);
      return null;
    }

    return {
      id: q.id,
      question: q.question_text,
      options: q.answers.map(a => a.text),
      correctAnswer: correctAnswerIndex
    };
  }).filter((q): q is GeneratedQuestion => q !== null);

  console.log(`Found ${generatedQuestions.length} questions for module "${moduleName}"`);
  return generatedQuestions;
}

/**
 * Get a random selection of questions for a module
 */
function getRandomQuestionsForModule(moduleName: string, count: number = 10): GeneratedQuestion[] {
  const allQuestions = getQuestionsForModule(moduleName);

  // Shuffle and take the first 'count' questions
  const shuffled = allQuestions.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, allQuestions.length));
}

/**
 * GET /api/questions?module=ModuleName&count=10
 * Returns questions for the specified module
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const moduleName = searchParams.get('module');
    const countParam = searchParams.get('count');
    const count = countParam ? parseInt(countParam, 10) : undefined;

    if (!moduleName) {
      return NextResponse.json(
        { error: 'Module parameter is required' },
        { status: 400 }
      );
    }

    const questions = count ? getRandomQuestionsForModule(moduleName, count) : getQuestionsForModule(moduleName);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: `No questions found for module "${moduleName}"` },
        { status: 404 }
      );
    }

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}