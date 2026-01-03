'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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
  modules?: {
    id: number;
    name: string;
    description: string;
  }[];
  questions: UploadedQuestion[];
}

export default function UploadPage() {
  const [jsonText, setJsonText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(e.target.value);
    setMessage('');
  };

  const handleUpload = async () => {
    if (!jsonText.trim()) return;

    setUploading(true);
    setMessage('');

    try {
      const data: UploadData = JSON.parse(jsonText);

      // Validate the JSON structure
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error('Invalid JSON format. Must contain a "questions" array.');
      }

      // Validate each question
      for (const question of data.questions) {
        if (!question.question_text || !question.answers || !Array.isArray(question.answers)) {
          throw new Error('Each question must have question_text and answers array.');
        }
        if (!question.answers.some(answer => answer.is_correct)) {
          throw new Error('Each question must have at least one correct answer.');
        }
      }

      // Send to API
      const response = await fetch('/api/upload-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage('Questions uploaded successfully!');
        setJsonText('');
      } else {
        const error = await response.json();
        setMessage(`Upload failed: ${error.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Invalid JSON text'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-3xl font-bold mb-8">Upload Extra Questions</h1>

        <div className="w-full max-w-md">
          <div className="mb-4">
            <label htmlFor="json-textarea" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Paste JSON containing questions:
            </label>
            <textarea
              id="json-textarea"
              value={jsonText}
              onChange={handleTextChange}
              placeholder="Paste your JSON here..."
              rows={15}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-xs"
            />
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              The JSON should contain an array of questions. IDs will be automatically generated to avoid conflicts. The structure should be:
            </p>
            <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-x-auto">
{`{
  "questions": [
    {
      "module_id": 1,
      "question_text": "What is AI?",
      "question_type": "multiple_choice",
      "difficulty": "easy",
      "answers": [
        {"text": "Artificial Intelligence", "is_correct": true},
        {"text": "Something else", "is_correct": false}
      ]
    }
  ]
}`}
            </pre>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded ${message.includes('successfully') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleUpload}
              disabled={!jsonText.trim() || uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Questions'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}