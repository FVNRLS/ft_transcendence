import './Profile.css';
import Header from '../Header/Header';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Profile = () => {

	const session = Cookies.get('session');
	const app_ip = process.env.REACT_APP_IP;

	const [oldUsername, setOldUsername] = useState('');
	const [oldEmail, setOldEmail] = useState('');
	const [picURL, setPicURL] = useState('');
	const [isBad, setIsBad] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {

		const getUserData = async () => {
			try {
				setIsLoading(true);
				const response = await axios.post(`http://${app_ip}:5000/auth/get_data`, { cookie: session });
				setOldUsername(response.data.username);
				setOldEmail(response.data.email);
			} catch (error) {
				console.log(error);
			}
		}

		const getPic = async () => {
			try {
				const response = await axios.post(`http://${app_ip}:5000/storage/get_profile_picture`, { cookie: session });
				const uintArray = new Uint8Array(response.data.buffer.data);
				const blob = new Blob([uintArray], { type: 'mimetype' });
				const imageUrl = URL.createObjectURL(blob);
				setPicURL(imageUrl);
			} catch (error) {
				console.log(error);
			} finally {
				setIsLoading(false);
			}
		}

		if (!session)
			navigate('/not-logged');
		else
		{
			getUserData();
			getPic();
		}
		
	}, [navigate, session]);


	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [signUpError, setSignUpError] = useState('');
	const [file, setFile] = useState(null);
	const [isLoading, setIsLoading] = useState(false);

	const cookie = Cookies.get('session');

	const handleFileChange = (event:any) => {
		setFile(event.target.files[0]);
	};

	const handleUsernameChange = (event:any) => {
		setUsername(event.target.value);
	}

	const handleEmailChange = (event:any) => {
		setEmail(event.target.value);
	}

	const sendEditData = async (event:any) => {
		event.preventDefault();
		setIsLoading(true);
		try {
			const formData = new FormData();
			if (cookie)
				formData.append('cookie', cookie);
			if (file)
				formData.append('file', file);
			if (email)
				formData.append('email', email);
			if (username)
				formData.append('username', username);
			const response = await axios.post(`http://${app_ip}:5000/auth/update_profile`, formData, {
				headers: {
				"Content-Type": "multipart/form-data",
			}});
			if (response.data.status !== 200)
				setIsBad(true);
			else
				setIsBad(false);
			setSignUpError(response.data.message);
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	}

	const messageStyle = {
		color: isBad ? '#f53939' : '#16A892',
	};

	return (
		<div className='bg'>
			<Header />
			<div className='form-cont' style={{height: '90vh'}}>
			{isLoading ? (<div className='spinner'/>)
			: (
			<form name="edit-prof" className='edit-form' style={{padding: 0}}>
				<h1>Edit Profile</h1>
				{signUpError && <h2 style={messageStyle}>{signUpError}</h2>}
				<div className='img-cont'>
				{file ? <img src={URL.createObjectURL(file)} alt="uploaded-img" /> : 
				(<img src={picURL} alt="profile pic" style={{ width: '175px', height: '175px' }} />)}
				</div>
				<label className='label-pic'>
					Change Profile Picture
					<input type="file" name="pic" onChange={handleFileChange}/>
				</label>
				<label className='label-text'>
					New username:
					<input className='input-text' placeholder={oldUsername} type="text" name="name" value={username} onChange={handleUsernameChange} />
				</label>
				<label className='label-text'>
					Change Email:
					<input className='input-text' placeholder={oldEmail} type="text" name="name" value={email} onChange={handleEmailChange} />
				</label>
				<label className='submit-lbl'>
					<input className='submit-btn' type="submit" value="Save" onClick={sendEditData} />
				</label>
			</form>
			)}
			
			</div>
		</div>
	);
}

export default Profile;