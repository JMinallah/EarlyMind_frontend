import { account, ID } from './config';

class AuthService {
    // Create a new account
    async createAccount({ email, password, name, userType = 'parent' }) {
        try {
            // First create the user account
            const userAccount = await account.create(ID.unique(), email, password, name);
            
            // Store userType in preferences (a simple way to store user metadata)
            // This avoids needing a separate database collection for now
            if (userAccount) {
                await account.updatePrefs({ userType });
                
                // Call login method to automatically log in the user after account creation
                return this.login({ email, password });
            } else {
                return userAccount;
            }
        } catch (error) {
            console.log("Appwrite service :: createAccount :: error", error);
            throw error;
        }
    }

    // Login user
    async login({ email, password }) {
        return await account.createEmailPasswordSession(email, password);
    }

    // Get current user
    async getCurrentUser() {
        try {
            const user = await account.get();
            
            // Also get user preferences which contain the userType
            if (user) {
                const prefs = await account.getPrefs();
                return {
                    ...user,
                    userType: prefs.userType || 'parent' // Default to parent if not set
                };
            }
            return user;
        } catch (error) {
            console.log("Appwrite service :: getCurrentUser :: error", error);
            return null;
        }
    }

    // Logout user
    async logout() {
        try {
            await account.deleteSessions();
        } catch (error) {
            console.log("Appwrite service :: logout :: error", error);
        }
    }

    // Check if user is logged in
    async isLoggedIn() {
        try {
            const user = await this.getCurrentUser();
            return !!user;
        } catch {
            return false;
        }
    }
}

const authService = new AuthService();
export default authService;