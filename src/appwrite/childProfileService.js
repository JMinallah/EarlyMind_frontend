import { databases, ID } from './config';
import { Query } from 'appwrite';

// Database and Collection IDs
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'earlymind_database';
const CHILD_PROFILES_COLLECTION_ID = import.meta.env.VITE_CHILD_PROFILES_COLLECTION_ID || 'child_profiles';

class ChildProfileService {
  /**
   * Create a new child profile
   * @param {Object} childData - Child profile data
   * @param {string} childData.parentId - ID of the parent user
   * @param {string} childData.name - Name of the child
   * @param {number} childData.age - Age of the child
   * @param {string} childData.gender - Optional gender of the child
   * @param {string} childData.notes - Optional notes about the child
   * @returns {Promise<Object>} The created child profile document
   */
  async createChildProfile(childData) {
    try {
      const profileData = {
        parent_id: childData.parentId,
        name: childData.name,
        age: childData.age,
        gender: childData.gender || null,
        notes: childData.notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sessions_count: 0,
        last_session: null
      };

      const childProfile = await databases.createDocument(
        DATABASE_ID,
        CHILD_PROFILES_COLLECTION_ID,
        ID.unique(),
        profileData
      );

      return childProfile;
    } catch (error) {
      console.error('Error creating child profile:', error);
      throw error;
    }
  }

  /**
   * Get all child profiles for a parent
   * @param {string} parentId - ID of the parent user
   * @returns {Promise<Array>} Array of child profile documents
   */
  async getChildProfiles(parentId) {
    try {
      const profiles = await databases.listDocuments(
        DATABASE_ID,
        CHILD_PROFILES_COLLECTION_ID,
        [
          Query.equal('parent_id', parentId),
          Query.orderDesc('updated_at')
        ]
      );

      return profiles.documents;
    } catch (error) {
      console.error('Error getting child profiles:', error);
      return [];
    }
  }

  /**
   * Get a child profile by ID
   * @param {string} profileId - ID of the child profile
   * @returns {Promise<Object>} The child profile document
   */
  async getChildProfileById(profileId) {
    try {
      const profile = await databases.getDocument(
        DATABASE_ID,
        CHILD_PROFILES_COLLECTION_ID,
        profileId
      );

      return profile;
    } catch (error) {
      console.error('Error getting child profile:', error);
      throw error;
    }
  }

  /**
   * Update a child profile
   * @param {string} profileId - ID of the child profile to update
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} The updated child profile document
   */
  async updateChildProfile(profileId, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const updatedProfile = await databases.updateDocument(
        DATABASE_ID,
        CHILD_PROFILES_COLLECTION_ID,
        profileId,
        updateData
      );

      return updatedProfile;
    } catch (error) {
      console.error('Error updating child profile:', error);
      throw error;
    }
  }

  /**
   * Delete a child profile
   * @param {string} profileId - ID of the child profile to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteChildProfile(profileId) {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        CHILD_PROFILES_COLLECTION_ID,
        profileId
      );

      return true;
    } catch (error) {
      console.error('Error deleting child profile:', error);
      throw error;
    }
  }

  /**
   * Update the session count for a child profile after a new session
   * @param {string} profileId - ID of the child profile
   * @param {string} sessionId - ID of the latest session
   * @returns {Promise<Object>} The updated child profile
   */
  async updateSessionCount(profileId, sessionId) {
    try {
      const profile = await this.getChildProfileById(profileId);
      
      const updatedProfile = await databases.updateDocument(
        DATABASE_ID,
        CHILD_PROFILES_COLLECTION_ID,
        profileId,
        {
          sessions_count: profile.sessions_count + 1,
          last_session: sessionId,
          updated_at: new Date().toISOString()
        }
      );

      return updatedProfile;
    } catch (error) {
      console.error('Error updating session count:', error);
      throw error;
    }
  }
}

const childProfileService = new ChildProfileService();
export default childProfileService;