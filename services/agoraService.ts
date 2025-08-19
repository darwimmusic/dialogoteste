import { User } from 'firebase/auth';

const TOKEN_SERVICE_URL = import.meta.env.VITE_TOKEN_SERVICE_URL;

export const getToken = async (channelName: string, user: User | null): Promise<string | null> => {
  if (!user) {
    console.error("User is not authenticated.");
    return null;
  }

  try {
    const idToken = await user.getIdToken();
    const response = await fetch(`${TOKEN_SERVICE_URL}/generate-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
      },
      body: JSON.stringify({ channelName }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Error fetching token:', error);
    return null;
  }
};
