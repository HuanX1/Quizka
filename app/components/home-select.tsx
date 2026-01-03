'use client';

import React, { useState } from 'react';

interface ModuleSelectorProps {
  modules: string[];
  onModuleChange?: (selectedModule: string) => void;
}

const ModuleSelector: React.FC<ModuleSelectorProps> = ({ modules, onModuleChange }) => {
  const [selectedModule, setSelectedModule] = useState<string>('');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedModule(value);
    if (onModuleChange) {
      onModuleChange(value);
    }
  };

  return (
    <div className="module-selector">
      <label htmlFor="module-select" className="pr-2">Select Module:</label>
      <select
        id="module-select"
        value={selectedModule}
        onChange={handleChange}
        className="border rounded p-2"
      >
        <option value="">-- Choose a module --</option>
        {modules.map((module, index) => (
          <option key={index} value={module}>
            {module}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModuleSelector;