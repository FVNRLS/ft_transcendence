import './Profile.css';
import Header from '../Header/Header';
import { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';

const Profile = () => {

	const session = Cookies.get('session');

	const navigate = useNavigate();

	useEffect(() => {
		if (!session)
		navigate('/not-logged');
	}, [navigate, session]);


	const [username, setUsername] = useState('');
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

	const sendEditData = async (event:any) => {
		event.preventDefault();
		setIsLoading(true);
			try {
				const formData = new FormData();
				if (cookie)
					formData.append('cookie', cookie);
				if (file)
					formData.append('file', file);
				const response = await axios.post('http://localhost:5000/storage/upload', formData, {
					headers: {
					  "Content-Type": "multipart/form-data",
					}});
				if (response.data.status === 201)
				{
					console.log("good");
				}
				else
					setSignUpError(response.data.message);
			} catch (error) {
				console.error(error);
			} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className='bg'>
			<Header />
			<div className='form-cont' style={{height: '90vh'}}>
			{isLoading ? (<div className='spinner'/>)
			: (
			<form name="edit-prof" className='edit-form' style={{padding: 0}}>
				<h1>Edit Profile</h1>
				{signUpError && <h2>{signUpError}</h2>}
				<div className='img-cont'>
				{file && <img src={URL.createObjectURL(file)} alt="uploaded-img" />}
				</div>
				<label className='label-pic'>
					Change Profile Picture
					<input type="file" name="pic" onChange={handleFileChange}/>
				</label>
				<label className='label-text'>
					New username:
					<input className='input-text' type="text" name="name" value={username} onChange={handleUsernameChange} />
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