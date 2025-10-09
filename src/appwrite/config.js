import { Client, Account, ID } from 'appwrite';

export const client = new Client();

client
    .setEndpoint(import.meta.env.VITE_APPWRITE_URL || 'https://cloud.appwrite.io/v1') // Your API Endpoint
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID); // Your project ID from environment variables

export const account = new Account(client);

export { ID };