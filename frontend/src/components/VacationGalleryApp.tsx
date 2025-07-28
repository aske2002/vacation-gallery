import React from 'react';
import { ApiProvider } from '../providers/ApiProvider';
import { ApiTest } from './ApiTest';

/**
 * Simple starter component that wraps the API test with the provider
 * Use this to test the full Vacation Gallery API integration
 */
export const VacationGalleryApp: React.FC = () => {
  return (
    <ApiProvider>
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f5f5f5',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <ApiTest />
      </div>
    </ApiProvider>
  );
};

export default VacationGalleryApp;
