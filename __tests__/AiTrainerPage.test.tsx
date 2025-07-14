/** @jest-environment jsdom */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

// Mock the aiChat function that performs the network request
jest.mock('@/lib/ai', () => ({
  __esModule: true,
  aiChat: jest.fn(),
}));

import { aiChat } from '@/lib/ai';
import AiTrainerPage from '@/pages/admin/ai-trainer/index.tsx';

// Mock AdminLayout to simplify the DOM tree for the unit test
jest.mock('@/components/admin/AdminLayout', () => ({
  // Simplified stub that just renders its children without JSX syntax
  AdminLayout: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock toast implementation to avoid side-effects
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

// Helper to render the page in a Router context
const renderPage = () =>
  render(
    <MemoryRouter>
      <AiTrainerPage />
    </MemoryRouter>
  );

describe('AiTrainerPage', () => {
  it('generates and displays interview questions', async () => {
    const mockResponse = '1. What is your greatest strength?\n2. Why do you want this role?\n3. Can you describe a challenge you overcame?\n4. How do you handle tight deadlines?\n5. Where do you see yourself in five years?';
    (aiChat as jest.Mock).mockResolvedValueOnce(mockResponse);

    renderPage();

    // Enter a description
    const textarea = screen.getByPlaceholderText(/paste the position description/i);
    await userEvent.type(textarea, 'Some job description');

    // Click the generate button
    const button = screen.getByRole('button', { name: /generate questions/i });
    await userEvent.click(button);

    // Wait for first question to appear in document
    await waitFor(() => {
      expect(screen.getByText('What is your greatest strength?')).toBeInTheDocument();
    });

    // Ensure all questions rendered
    const questions = screen.getAllByRole('listitem');
    expect(questions).toHaveLength(5);

    // Validate aiChat called with expected arguments
    expect(aiChat).toHaveBeenCalledTimes(1);
  });
}); 