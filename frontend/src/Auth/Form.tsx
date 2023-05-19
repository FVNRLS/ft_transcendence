import React, {useEffect, useState} from 'react'
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import './Form.css'

const Form = () => 
{
	const [isLoading, setIsLoading] = useState(false);
	const [signInError, setSignInError] = useState('');
	const [signUpError, setSignUpError] = useState('');
	const [switchUp, setSwitchUp] = useState(false);
	const [file, setFile] = useState(null);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');

	const navigate = useNavigate();

	const handleFileChange = (event:any) => {
		setFile(event.target.files[0]);
	};

	useEffect(() => {
		const authorize = async () => {
		  try {
				await axios.get('http://localhost:5000/auth/authorize');
			} catch (error) {
				console.error(error);
			}
		};
	  
		authorize();
	}, []);

	const sendSignUpData = async (event:any) => {
		event.preventDefault();
		setIsLoading(true);
		let formData = new FormData();
		formData.append('username', username);
		formData.append('password', password);
		if (file)
			formData.append('file', file);
			try {
				const response = await axios.post('http://localhost:5000/auth/signup', formData, {
					headers: {
					  "Content-Type": "multipart/form-data",
					}});
				if (response.data.status === 201)
				{
					Cookies.set('session', response.data.cookie);
					navigate('/');
				}
				else
					setSignUpError(response.data.message);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
	}

	const sendSignInData = async (event:any) => {
		event.preventDefault();
		setIsLoading(true);
			try {
				const response = await axios.post('http://localhost:5000/auth/login', {
					username: username,
					password: password
				});
				if (response.data.status === 201)
				{
					Cookies.set('session', response.data.cookie);
					navigate('/');
				}
				else
					setSignInError(response.data.message);
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
	}

	const handleSwitch = () => {
		setSwitchUp(!switchUp);
	  };

	const cont_style = {
		height: switchUp ? '100vh' : '40rem',
	};

	const handleUsernameChange = (event:any) => {
		setUsername(event.target.value);
	}

	const handlePasswordChange = (event:any) => {
		setPassword(event.target.value);
	}

	return (
		<div className='bg' style={{paddingTop: 0, height: '100vh'}}>
		<div className='form-cont' style={cont_style}>
			{ isLoading ? (
			<div className='spinner'/>
			) : switchUp ? (
			<form name="signup" className='signup-form'>
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
					<input className='input-text' type="text" name="name" onChange={handleUsernameChange} />
				</label>
				<label className='label-text'>
					Password:
					<input className='input-text' type="password" name="pass" onChange={handlePasswordChange}/>
				</label>
				<label className='submit-lbl'>
					<input className='submit-btn' type="submit" onClick={sendSignUpData}/>
				</label>
			</form>
			) : (
			<form name="signin" className='signin-form'>
				<h1>Sign In</h1>
				{signInError && <h2>{signInError}</h2>}
				<label className='label-text'>
					Username:
					<input className='input-text' type="text" name="name" onChange={handleUsernameChange}/>
				</label>
				<label className='label-text'>
					Password:
					<input className='input-text' type="password" name="pass" onChange={handlePasswordChange}/>
				</label>
				<label className='submit-lbl'>
					<input className='submit-btn' type="submit" onClick={sendSignInData}/>
				</label>
			</form>
			)}
			<label className="switch">
				<input type="checkbox" onChange={handleSwitch}/>
				<span className="slider"></span>
			</label>
		</div>
		</div>
	)
}

export default Form;