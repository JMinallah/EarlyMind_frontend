import { databases, ID } from './config';
import { Query } from 'appwrite';

// Database and Collection IDs - Add these to your .env file
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'earlymind_database';
const CHAT_SESSIONS_COLLECTION_ID = import.meta.env.VITE_CHAT_SESSIONS_COLLECTION_ID || 'chat_sessions';
const CHAT_MESSAGES_COLLECTION_ID = import.meta.env.VITE_CHAT_MESSAGES_COLLECTION_ID || 'chat_messages';

class SessionService {
  /**
   * Create a new chat session
   * @param {string} parentId - ID of the parent user
   * @param {string} childName - Optional name of the child
   * @returns {Promise<Object>} The created session document
   */
  async createSession(parentId, childName = null) {
    try {
      const sessionData = {
        parent_id: parentId,
        child_name: childName,
        session_start: new Date().toISOString(),
        session_end: null,
        status: 'active',
        total_messages: 0,
        duration_minutes: null,
        last_activity: new Date().toISOString(),
        notes: null
      };

      const session = await databases.createDocument(
        DATABASE_ID,
        CHAT_SESSIONS_COLLECTION_ID,
        ID.unique(),
        sessionData
      );

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * End a chat session
   * @param {string} sessionId - ID of the session to end
   * @returns {Promise<Object>} The updated session document
   */
  async endSession(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const sessionStart = new Date(session.session_start);
      const sessionEnd = new Date();
      const durationMinutes = Math.round((sessionEnd - sessionStart) / (1000 * 60));

      const updatedSession = await databases.updateDocument(
        DATABASE_ID,
        CHAT_SESSIONS_COLLECTION_ID,
        sessionId,
        {
          session_end: sessionEnd.toISOString(),
          status: 'completed',
          duration_minutes: durationMinutes,
          last_activity: sessionEnd.toISOString()
        }
      );

      return updatedSession;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Get a specific session by ID
   * @param {string} sessionId - ID of the session
   * @returns {Promise<Object>} The session document
   */
  async getSession(sessionId) {
    try {
      const session = await databases.getDocument(
        DATABASE_ID,
        CHAT_SESSIONS_COLLECTION_ID,
        sessionId
      );
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions for a parent
   * @param {string} parentId - ID of the parent user
   * @param {number} limit - Maximum number of sessions to return
   * @returns {Promise<Object>} List of sessions
   */
  async getParentSessions(parentId, limit = 50) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHAT_SESSIONS_COLLECTION_ID,
        [
          Query.equal('parent_id', parentId),
          Query.orderDesc('session_start'),
          Query.limit(limit)
        ]
      );
      return response.documents;
    } catch (error) {
      console.error('Error getting parent sessions:', error);
      throw error;
    }
  }

  /**
   * Get active session for a parent (if any)
   * @param {string} parentId - ID of the parent user
   * @returns {Promise<Object|null>} The active session or null
   */
  async getActiveSession(parentId) {
    try {
      const sessions = await databases.listDocuments(
        DATABASE_ID,
        CHAT_SESSIONS_COLLECTION_ID,
        [
          Query.equal('parent_id', parentId),
          Query.equal('status', 'active'),
          Query.limit(1)
        ]
      );
      
      return sessions.documents.length > 0 ? sessions.documents[0] : null;
    } catch (error) {
      console.error('Error getting active session:', error);
      throw error;
    }
  }

  /**
   * Add a message to a session
   * @param {string} sessionId - ID of the session
   * @param {string} speaker - Who sent the message ('child', 'milo', 'system')
   * @param {string} message - The message content
   * @param {Object} metadata - Optional metadata
   * @returns {Promise<Object>} The created message document
   */
  async addMessage(sessionId, speaker, message, metadata = {}) {
    try {
      // Get existing messages for this session to determine order
      const existingMessages = await this.getSessionMessages(sessionId);
      const messageOrder = existingMessages.length + 1;

      const messageData = {
        session_id: sessionId,
        speaker: speaker,
        message: message,
        timestamp: new Date().toISOString(),
        message_order: messageOrder,
        message_type: 'text',
        emotion_detected: null,
        response_time_ms: metadata.responseTime || null,
        metadata: metadata ? JSON.stringify(metadata) : null
      };

      // Create the message
      const messageDoc = await databases.createDocument(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        ID.unique(),
        messageData
      );

      return messageDoc;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  /**
   * Get all messages for a session
   * @param {string} sessionId - ID of the session
   * @returns {Promise<Object>} List of messages
   */
  async getSessionMessages(sessionId) {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        [
          Query.equal('session_id', sessionId),
          Query.orderAsc('message_order'),
          Query.limit(1000) // Adjust as needed
        ]
      );
      return response.documents;
    } catch (error) {
      console.error('Error getting session messages:', error);
      throw error;
    }
  }

  /**
   * Get recent messages for AI context
   * @param {string} sessionId - ID of the session
   * @param {number} limit - Number of recent messages to get
   * @returns {Promise<Array>} Array of recent messages
   */
  async getRecentMessages(sessionId, limit = 10) {
    try {
      const messages = await databases.listDocuments(
        DATABASE_ID,
        CHAT_MESSAGES_COLLECTION_ID,
        [
          Query.equal('session_id', sessionId),
          Query.orderDesc('message_order'),
          Query.limit(limit)
        ]
      );
      
      // Reverse to get chronological order (oldest first)
      return messages.documents.reverse();
    } catch (error) {
      console.error('Error getting recent messages:', error);
      throw error;
    }
  }

  /**
   * Update session notes
   * @param {string} sessionId - ID of the session
   * @param {string} notes - Notes to add
   * @returns {Promise<Object>} The updated session
   */
  async updateSessionNotes(sessionId, notes) {
    try {
      const updatedSession = await databases.updateDocument(
        DATABASE_ID,
        CHAT_SESSIONS_COLLECTION_ID,
        sessionId,
        { notes: notes }
      );
      return updatedSession;
    } catch (error) {
      console.error('Error updating session notes:', error);
      throw error;
    }
  }
}

const sessionService = new SessionService();
export default sessionService;