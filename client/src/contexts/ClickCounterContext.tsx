import React, { createContext, useContext, useState } from 'react';

interface ClickCounterState {
  jobSeekers: number;
  applicants: number;
}

interface ClickCounterActions {
  incrementJobSeekers: () => void;
  incrementApplicants: () => void;
  resetCounters: () => void;
}

interface ClickCounterContextType extends ClickCounterState, ClickCounterActions {}

const ClickCounterContext = createContext<ClickCounterContextType | undefined>(undefined);

export const useClickCounter = () => {
  const context = useContext(ClickCounterContext);
  if (!context) {
    throw new Error('useClickCounter must be used within a ClickCounterProvider');
  }
  return context;
};

interface ClickCounterProviderProps {
  children: React.ReactNode;
}

export const ClickCounterProvider: React.FC<ClickCounterProviderProps> = ({ children }) => {
  const [state, setState] = useState<ClickCounterState>({
    jobSeekers: 0,
    applicants: 0,
  });

  const incrementJobSeekers = () => {
    setState(prev => ({ ...prev, jobSeekers: prev.jobSeekers + 1 }));
  };

  const incrementApplicants = () => {
    setState(prev => ({ ...prev, applicants: prev.applicants + 1 }));
  };

  const resetCounters = () => {
    setState({ jobSeekers: 0, applicants: 0 });
  };

  const value: ClickCounterContextType = {
    ...state,
    incrementJobSeekers,
    incrementApplicants,
    resetCounters,
  };

  return (
    <ClickCounterContext.Provider value={value}>
      {children}
    </ClickCounterContext.Provider>
  );
};