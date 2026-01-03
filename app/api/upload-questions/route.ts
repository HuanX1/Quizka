import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { clearQuizDataCache } from '../questions/route';
import { clearModulesDataCache } from '../modules/route';

interface Question {
  id: number;
  module_id: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  answers: {
    text: string;
    is_correct: boolean;
  }[];
}

interface Module {
  id: number;
  name: string;
  description: string;
}

interface QuizData {
  modules: Module[];
  questions: Question[];
}

interface UploadedQuestion {
  id?: number;
  module_id: number;
  question_text: string;
  question_type: string;
  difficulty: string;
  answers: {
    text: string;
    is_correct: boolean;
  }[];
}

interface UploadData {
  modules?: Module[];
  questions: UploadedQuestion[];
}

/**
 * Load quiz data from JSON file
 */
function loadQuizData(): QuizData {
  const dataPath = path.join(process.cwd(), 'data', 'quiz-data.json');
  const data = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(data);
}

/**
 * Save quiz data to JSON file
 */
function saveQuizData(data: QuizData): void {
  const dataPath = path.join(process.cwd(), 'data', 'quiz-data.json');
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
}

/**
 * POST /api/upload-questions
 * Uploads additional questions from JSON data
 */
export async function POST(request: NextRequest) {
  try {
    const body: UploadData = await request.json();

    if (!body.questions || !Array.isArray(body.questions)) {
      return NextResponse.json(
        { error: 'Invalid data format. Must contain a "questions" array.' },
        { status: 400 }
      );
    }

    // Load existing data
    const existingData = loadQuizData();

    // Validate and process uploaded questions
    const newQuestions: Question[] = [];
    let nextId = Math.max(...existingData.questions.map(q => q.id), 0) + 1;

    for (const uploadedQuestion of body.questions) {
      // Validate required fields
      if (!uploadedQuestion.question_text || !uploadedQuestion.answers || !Array.isArray(uploadedQuestion.answers)) {
        return NextResponse.json(
          { error: 'Each question must have question_text and answers array.' },
          { status: 400 }
        );
      }

      // Check if module_id exists
      const moduleExists = existingData.modules.some(m => m.id === uploadedQuestion.module_id);
      if (!moduleExists) {
        return NextResponse.json(
          { error: `Module with id ${uploadedQuestion.module_id} does not exist.` },
          { status: 400 }
        );
      }

      // Check if at least one answer is correct
      if (!uploadedQuestion.answers.some(answer => answer.is_correct)) {
        return NextResponse.json(
          { error: 'Each question must have at least one correct answer.' },
          { status: 400 }
        );
      }

      // Create new question with auto-generated unique ID (always generate new ID to avoid conflicts)
      const newQuestion: Question = {
        id: nextId++,
        module_id: uploadedQuestion.module_id,
        question_text: uploadedQuestion.question_text,
        question_type: uploadedQuestion.question_type || 'multiple_choice',
        difficulty: uploadedQuestion.difficulty || 'medium',
        answers: uploadedQuestion.answers
      };

      newQuestions.push(newQuestion);
    }

    // Add new questions to existing data
    existingData.questions.push(...newQuestions);

    // Update question counts in modules
    existingData.modules.forEach(module => {
      const questionCount = existingData.questions.filter(q => q.module_id === module.id).length;
      // Note: The current data structure doesn't have questionCount in modules, but we can add it if needed
      // For now, we'll just ensure the data is consistent
    });

    // Save updated data
    saveQuizData(existingData);

    // Clear the cache in the questions and modules APIs
    clearQuizDataCache();
    clearModulesDataCache();

    return NextResponse.json({
      message: `Successfully uploaded ${newQuestions.length} questions.`,
      uploadedCount: newQuestions.length
    });

  } catch (error) {
    console.error('Error uploading questions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}