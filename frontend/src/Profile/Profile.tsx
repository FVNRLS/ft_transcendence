import './Profile.css';
import Header from '../Header/Header';

const Profile = () => {

	return (
		<div className='bg'>
			<Header />
			{/* <form name="signup" className='signup-form'>
				<h1>Sign Up</h1>
				{signUpError && <h2>{signUpError}</h2>}
				<div className='img-cont'>
				{file && <img src={URL.createObjectURL(file)} alt="uploaded-img" />}
				</div>
				<label className='label-pic'>
					Upload Profile Picture
					<input type="file" name="pic" onChange={handleFileChange}/>
				</label>
				<label className='label-text'>
					Username:
					<input className='input-text' type="text" name="name" value={username} onChange={handleUsernameChange} />
				</label>
				<label className='label-text'>
					Password:
					<input className='input-text' type="password" name="pass" value={password} onChange={handlePasswordChange}/>
				</label>
				<label className='submit-lbl'>
					<input className='submit-btn' type="submit" onClick={sendSignUpData}/>
				</label>
			</form> */}
		</div>
	);
}

export default Profile;