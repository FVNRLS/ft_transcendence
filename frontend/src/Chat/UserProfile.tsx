import React from 'react';
import { User } from './Chat';  // Import interfaces from Chat component

interface UserProfileProps {
  user: User | null;
  closeProfile: () => void;
  userPics: {pic: string, username: string}[]; // Array of user pictures and corresponding usernames
  currentUserPic: string | null; // Profile picture of the current user
  loggedInUser: User | null;

}

const UserProfile: React.FC<UserProfileProps> = ({ user, closeProfile, userPics, currentUserPic, loggedInUser }) => {
  if (!user) return null;

  // If it's the currently logged in user, use currentUserPic. Otherwise, find the picture in userPics.
  const avatarUrl = user.id == loggedInUser.id ? currentUserPic : userPics.find((userPic) => userPic.username === user.username)?.pic;

  return (
    <div className="user-profile-overlay">
      <div className="user-profile">
        <div className="profile-content">
          <img src={avatarUrl} alt={`${user.username}'s avatar`} className="profile-picture" />
          <h2>{user.username}</h2>
          {/* add other fields you want to show, like email or join date */}
          <button onClick={closeProfile}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
