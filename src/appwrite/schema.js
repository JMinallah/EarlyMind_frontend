/**
 * EarlyMind Database Schema for Appwrite
 * 
 * This file defines the database structure for managing chat sessions and messages
 * Follow these steps to set up your Appwrite database:
 */

// Database: earlymind_database
// Collections needed:

/**
 * Collection 1: chat_sessions
 * Document ID: Auto-generated
 * Purpose: Store information about each chat session
 */
export const chatSessionsSchema = {
  name: "chat_sessions",
  documentSecurity: true,
  permissions: [
    "read(\"user:{userId}\")",
    "create(\"user:{userId}\")",
    "update(\"user:{userId}\")",
    "delete(\"user:{userId}\")"
  ],
  attributes: [
    {
      key: "parent_id",
      type: "string",
      size: 255,
      required: true,
      array: false,
      description: "ID of the parent who started the session"
    },
    {
      key: "child_name", 
      type: "string",
      size: 100,
      required: false,
      array: false,
      description: "Name of the child (optional)"
    },
    {
      key: "session_start",
      type: "datetime",
      required: true,
      array: false,
      description: "When the session started"
    },
    {
      key: "session_end",
      type: "datetime", 
      required: false,
      array: false,
      description: "When the session ended (null if still active)"
    },
    {
      key: "status",
      type: "string",
      size: 20,
      required: true,
      array: false,
      default: "active",
      description: "Session status: active, completed, abandoned"
    },
    {
      key: "total_messages",
      type: "integer",
      required: true,
      array: false,
      default: 0,
      description: "Total number of messages in this session"
    },
    {
      key: "duration_minutes",
      type: "integer",
      required: false,
      array: false,
      description: "Session duration in minutes (calculated when ended)"
    },
    {
      key: "last_activity",
      type: "datetime",
      required: true,
      array: false,
      description: "Last activity timestamp in this session"
    },
    {
      key: "notes",
      type: "string",
      size: 1000,
      required: false,
      array: false,
      description: "Optional notes about the session"
    }
  ],
  indexes: [
    {
      key: "parent_sessions",
      type: "key",
      attributes: ["parent_id", "session_start"],
      orders: ["ASC", "DESC"]
    },
    {
      key: "active_sessions",
      type: "key", 
      attributes: ["parent_id", "status"],
      orders: ["ASC", "ASC"]
    },
    {
      key: "session_timeline",
      type: "key",
      attributes: ["session_start"],
      orders: ["DESC"]
    }
  ]
};

/**
 * Collection 2: chat_messages
 * Document ID: Auto-generated
 * Purpose: Store individual messages within chat sessions
 */
export const chatMessagesSchema = {
  name: "chat_messages",
  documentSecurity: true,
  permissions: [
    "read(\"user:{userId}\")",
    "create(\"user:{userId}\")",
    "update(\"user:{userId}\")",
    "delete(\"user:{userId}\")"
  ],
  attributes: [
    {
      key: "session_id",
      type: "string",
      size: 255,
      required: true,
      array: false,
      description: "Reference to the chat session document ID"
    },
    {
      key: "speaker",
      type: "string",
      size: 20,
      required: true,
      array: false,
      description: "Who sent the message: 'child', 'milo', 'system'"
    },
    {
      key: "message",
      type: "string",
      size: 5000,
      required: true,
      array: false,
      description: "The actual message content"
    },
    {
      key: "timestamp",
      type: "datetime",
      required: true,
      array: false,
      description: "When the message was sent"
    },
    {
      key: "message_order",
      type: "integer",
      required: true,
      array: false,
      description: "Order of message in the session (1, 2, 3...)"
    },
    {
      key: "message_type",
      type: "string",
      size: 20,
      required: true,
      array: false,
      default: "text",
      description: "Type of message: text, audio, system, error"
    },
    {
      key: "emotion_detected",
      type: "string",
      size: 50,
      required: false,
      array: false,
      description: "Detected emotion (future feature)"
    },
    {
      key: "response_time_ms",
      type: "integer",
      required: false,
      array: false,
      description: "How long AI took to respond (milliseconds)"
    },
    {
      key: "metadata",
      type: "string",
      size: 1000,
      required: false,
      array: false,
      description: "Additional metadata as JSON string"
    }
  ],
  indexes: [
    {
      key: "session_messages",
      type: "key",
      attributes: ["session_id", "message_order"],
      orders: ["ASC", "ASC"]
    },
    {
      key: "message_timeline",
      type: "key",
      attributes: ["session_id", "timestamp"],
      orders: ["ASC", "ASC"]
    },
    {
      key: "speaker_filter",
      type: "key",
      attributes: ["session_id", "speaker"],
      orders: ["ASC", "ASC"]
    }
  ]
};

/**
 * To create these collections in Appwrite Console:
 * 
 * 1. Go to your Appwrite Console
 * 2. Navigate to Databases
 * 3. Create a new database called "earlymind_database"
 * 4. Create Collection 1: "chat_sessions" with the attributes above
 * 5. Create Collection 2: "chat_messages" with the attributes above
 * 6. Set up the indexes as specified
 * 7. Configure permissions to allow users to read/write their own data
 */

// Database and Collection IDs for your .env file:
export const DATABASE_CONFIG = {
  DATABASE_ID: "earlymind_database",
  CHAT_SESSIONS_COLLECTION_ID: "chat_sessions", 
  CHAT_MESSAGES_COLLECTION_ID: "chat_messages"
};