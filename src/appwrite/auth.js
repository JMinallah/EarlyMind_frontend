import { account, ID } from './config';

class AuthService {
    // Create a new account
    async createAccount({ email, password, name, userType = 'parent' }) {
        try {
            console.log("Attempting to create account for:", email);
            
            // First create the user account
            const userAccount = await account.create(ID.unique(), email, password, name);
            
            console.log("Account created successfully:", userAccount);
            
            // Store userType in preferences (a simple way to store user metadata)
            // This avoids needing a separate database collection for now
            if (userAccount) {
                try {
                    await account.updatePrefs({ userType });
                    console.log("User preferences updated successfully");
                } catch (prefError) {
                    console.log("Warning: Could not update preferences:", prefError);
                    // Don't throw error for preferences, continue with login
                }
                
                // Call login method to automatically log in the user after account creation
                const loginResult = await this.login({ email, password });
                return loginResult; // This now contains both session and user
            } else {
                return userAccount;
            }
        } catch (error) {
            console.log("Appwrite service :: createAccount :: error", error);
            
            // Provide more specific error messages
            if (error.message?.includes('scope') || error.message?.includes('permission')) {
                throw new Error("Registration is not enabled. Please contact support or check Appwrite project settings.");
            }
            
            throw error;
        }
    }

    // Login user
    async login({ email, password }) {
        // Create the email session
        const session = await account.createEmailPasswordSession(email, password);
        
        if (session) {
            // Get the user data including preferences
            const user = await this.getCurrentUser();
            return { session, user };
        }
        
        return { session: null, user: null };
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