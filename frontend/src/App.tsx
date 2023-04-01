import React, { useState } from 'react';
import axios from 'axios';

interface User {
    id: number;
    name: string;
    email: string;
}

function App() {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const handleAuthClick = () => {
        // Replace with your own values
        const clientId = "u-s4t2ud-b6bbfd6ea348daf72fd11cc6fbe63bad9d5e492ecae19cd689883a6b0f3fdabd";
        const clientSecret = "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";
        const redirectUri = "https://localhost:3000/auth-42";

        // Redirect the user to the 42 OAuth2 authorization page
        window.location.href = `https://api.intra.42.fr/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code`;
    };

    const handleBackendAuth = async () => {
        try {
            // Send the access token to your backend
            await axios.post('http://localhost:5000/auth', {
                accessToken: accessToken,
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {accessToken ? (
                <div>
                    <p>You are authenticated with 42 API!</p>
                    <button onClick={handleBackendAuth}>Authenticate on backend</button>
                </div>
            ) : (
                <button onClick={handleAuthClick}>Authenticate with 42 API</button>
            )}
        </div>
    );
}

export default App;




