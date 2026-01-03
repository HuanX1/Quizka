'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface HomeButtonProps {
  selectedModule: string;
  numQuestions: number;
}

const HomeButtons: React.FC<HomeButtonProps> = ({ selectedModule, numQuestions }) => {
  const router = useRouter();

  const handleUploadQuestions = () => {
    router.push('/upload');
  };

  const handleStartQuiz = () => {
    if (selectedModule) {
      // Navigate to quiz page with selected module and number of questions as query parameters
      router.push(`/quiz?module=${encodeURIComponent(selectedModule)}&count=${numQuestions}`);
    } else {
      alert('Please select a module first');
    }
  };

  return (
    <div className="home-buttons">
      <button
        className="bg-green-600 text-white px-4 py-2 mt-4 rounded mr-4 hover:bg-green-700 disabled:opacity-50"
        onClick={handleStartQuiz}
        disabled={!selectedModule}
      >
        Start Quiz
      </button>
      <button
        className="bg-blue-600 text-white px-4 py-2 mt-4 rounded hover:bg-blue-700"
        onClick={handleUploadQuestions}
      >
        Upload Questions
      </button>
    </div>
  );
};

export default HomeButtons;