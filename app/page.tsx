'use client'

import Image from "next/image";
import { useState, useEffect } from "react";
import ModuleSelector from "./components/home-select";
import HomeButtons from "./components/home-buttons";

interface Module {
  id: number;
  name: string;
  description: string;
  questionCount: number;
}

export default function Home() {
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [modules, setModules] = useState<Module[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(0);
  const [numQuestions, setNumQuestions] = useState<number>(10);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch('/api/modules');
        const data = await response.json();
        setModules(data.modules);
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };
    fetchModules();
  }, []);

  const handleModuleChange = (module: string) => {
    setSelectedModule(module);
    const selected = modules.find(m => m.name === module);
    if (selected) {
      setQuestionCount(selected.questionCount);
      setNumQuestions(Math.min(10, selected.questionCount)); // Default to 10 or max available
    }
  };

  const moduleNames = modules.map(m => m.name);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full max-w-3xl flex-col items-center py-32 px-16 bg-white dark:bg-black sm:items-start">
        <ModuleSelector
          modules={moduleNames}
          onModuleChange={handleModuleChange}
        />
        {selectedModule && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Total questions in {selectedModule}: {questionCount}
            </p>
            <div className="mt-2">
              <label htmlFor="numQuestions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Number of questions to test on:
              </label>
              <input
                type="number"
                id="numQuestions"
                min="1"
                max={questionCount}
                value={numQuestions}
                onChange={(e) => setNumQuestions(Math.min(parseInt(e.target.value) || 1, questionCount))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
        )}
        <HomeButtons selectedModule={selectedModule} numQuestions={numQuestions} />
      </main>
    </div>
  );
}
