// Test Appwrite Connection
import { client, account } from './config.js';

// Test if client is properly configured
export const testAppwriteConnection = async () => {
  try {
    console.log('Testing Appwrite connection...');
    console.log('Project ID:', import.meta.env.VITE_APPWRITE_PROJECT_ID);
    console.log('Endpoint:', import.meta.env.VITE_APPWRITE_ENDPOINT);
    
    // Test basic health check (this should work even for guests)
    const health = await client.call('get', '/health');
    console.log('Appwrite health check:', health);
    
    // Test account service (this might fail if permissions are wrong)
    try {
      const session = await account.getSession('current');
      console.log('Current session:', session);
    } catch (sessionError) {
      console.log('No active session (this is normal for new users):', sessionError.message);
    }
    
    return { success: true, message: 'Connection test completed' };
  } catch (error) {
    console.error('Appwrite connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Test registration without login
export const testRegistration = async () => {
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testName = 'Test User';
  
  try {
    console.log('Testing registration with:', testEmail);
    
    const user = await account.create(
      'unique()', // Let Appwrite generate unique ID
      testEmail,
      testPassword,
      testName
    );
    
    console.log('Registration successful:', user);
    
    // Clean up - delete the test account
    try {
      await account.deleteSession('current');
      await account.delete();
      console.log('Test account cleaned up');
    } catch (cleanupError) {
      console.log('Cleanup warning:', cleanupError.message);
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Registration test failed:', error);
    return { success: false, error: error.message };
  }
};