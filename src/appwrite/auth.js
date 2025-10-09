import { account, ID } from './config';

class AuthService {
    // Create a new account
    async createAccount({ email, password, name }) {
        const userAccount = await account.create(ID.unique(), email, password, name);
        if (userAccount) {
            // Call login method to automatically log in the user after account creation
            return this.login({ email, password });
        } else {
            return userAccount;
        }
    }

    // Login user
    async login({ email, password }) {
        return await account.createEmailPasswordSession(email, password);
    }

    // Get current user
    async getCurrentUser() {
        try {
            return await account.get();
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