'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getQuestionsForModule, GeneratedQuestion } from './questionGenerator';

const QuizContent: React.FC = () => {
  const searchParams = useSearchParams();
  const module = searchParams.get('module') || 'Unknown Module';
  const countParam = searchParams.get('count');
  const count = countParam ? parseInt(countParam, 10) : undefined;

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [optionMapping, setOptionMapping] = useState<number[]>([]);

  // Function to shuffle array and return both shuffled array and mapping
  const shuffleOptions = (options: string[]) => {
    const indices = options.map((_, index) => index);
    const shuffledIndices = [...indices].sort(() => Math.random() - 0.5);
    const shuffledOptions = shuffledIndices.map(index => options[index]);
    return { shuffledOptions, shuffledIndices };
  };

  // Load questions from database when component mounts
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const loadedQuestions = await getQuestionsForModule(module, count);
        setQuestions(loadedQuestions);

        if (loadedQuestions.length === 0) {
          setError(`No questions found for module: ${module}`);
        } else {
          // Shuffle options for the first question
          const { shuffledOptions: initialShuffled, shuffledIndices: initialMapping } = shuffleOptions(loadedQuestions[0].options);
          setShuffledOptions(initialShuffled);
          setOptionMapping(initialMapping);
        }
      } catch (err) {
        console.error('Error loading questions:', err);
        setError('Failed to load questions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [module]);

  // Shuffle options when question changes
  useEffect(() => {
    if (questions.length > 0 && currentQuestion < questions.length) {
      const { shuffledOptions: newShuffled, shuffledIndices: newMapping } = shuffleOptions(questions[currentQuestion].options);
      setShuffledOptions(newShuffled);
      setOptionMapping(newMapping);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentQuestion, questions]);

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (!showFeedback) {
      // First click: show feedback
      setShowFeedback(true);
    } else {
      // Second click: update score and move to next question
      // Map the selected answer back to original index to check correctness
      const originalSelectedIndex = selectedAnswer !== null ? optionMapping[selectedAnswer] : null;
      if (originalSelectedIndex === questions[currentQuestion]?.correctAnswer) {
        setScore(score + 1);
      }

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        setShowResult(true);
      }
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
    setShowFeedback(false);
    // Re-shuffle options for the first question
    if (questions.length > 0) {
      const { shuffledOptions: newShuffled, shuffledIndices: newMapping } = shuffleOptions(questions[0].options);
      setShuffledOptions(newShuffled);
      setOptionMapping(newMapping);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg">Loading questions for {module}...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Error</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // No questions found
  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            No questions found for module: {module}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    let classification = '';

    if (percentage >= 70) {
      classification = `First Class (${percentage}%)`;
    } else if (percentage >= 60) {
      classification = `2:1 (${percentage}%)`;
    } else if (percentage >= 50) {
      classification = `2:2 (${percentage}%)`;
    } else if (percentage >= 40) {
      classification = `Third Class (${percentage}%)`;
    } else {
      classification = `Fail (${percentage}%)`;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4 text-center">Quiz Complete!</h1>
          <p className="text-lg mb-4 text-center">
            Module: {module}
          </p>
          <p className="text-xl mb-6 text-center">
            Your Score: {score} / {questions.length}
          </p>
          <p className="text-lg mb-6 text-center font-semibold">
            {classification}
          </p>
          <div className="text-center space-y-3">
            <button
              onClick={handleRestartQuiz}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 mr-2"
            >
              Take Quiz Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Quiz: {module}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">
            {questions[currentQuestion]?.question}
          </h2>

          <div className="space-y-3">
            {shuffledOptions.map((option, index) => {
              let buttonClass = 'w-full text-left p-3 rounded border-2 transition-colors ';

              if (showFeedback) {
                // Check if this shuffled option corresponds to the correct answer
                const originalIndex = optionMapping[index];
                const isCorrect = originalIndex === questions[currentQuestion]?.correctAnswer;
                const isSelected = index === selectedAnswer;

                if (isCorrect) {
                  buttonClass += 'border-green-500 bg-green-50 dark:bg-green-900 text-green-800 dark:text-green-200';
                } else if (isSelected) {
                  buttonClass += 'border-red-500 bg-red-50 dark:bg-red-900 text-red-800 dark:text-red-200';
                } else {
                  buttonClass += 'border-gray-300 opacity-50';
                }
              } else {
                buttonClass += selectedAnswer === index
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                  : 'border-gray-300 hover:border-gray-400';
              }

              return (
                <button
                  key={index}
                  onClick={() => !showFeedback && handleAnswerSelect(index)}
                  disabled={showFeedback}
                  className={buttonClass}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Score: {score}
          </div>
          <button
            onClick={handleNextQuestion}
            disabled={selectedAnswer === null}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {showFeedback
              ? (currentQuestion === questions.length - 1 ? 'Finish Quiz' : 'Next Question')
              : 'Check Answer'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

const QuizPage: React.FC = () => {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <QuizContent />
    </Suspense>
  );
};

export default QuizPage;