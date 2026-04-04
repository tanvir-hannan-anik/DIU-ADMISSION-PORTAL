import { useState, useCallback } from 'react';
import { aiService } from '../services/aiService';

export const useAI = () => {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingTime, setProcessingTime] = useState(null);

  const processPrompt = useCallback(async (promptData) => {
    setLoading(true);
    setError(null);

    const startTime = performance.now();

    try {
      const result = await aiService.processPrompt(promptData);

      if (result.success) {
        setResponse(result.data);
        setProcessingTime(performance.now() - startTime);
      } else {
        setError(result.error);
        setResponse(null);
      }

      return result;
    } catch (err) {
      setError(err.message || 'Failed to process prompt');
      setResponse(null);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResponse = useCallback(() => {
    setResponse(null);
    setError(null);
    setProcessingTime(null);
  }, []);

  return {
    response,
    loading,
    error,
    processingTime,
    processPrompt,
    clearResponse,
  };
};
