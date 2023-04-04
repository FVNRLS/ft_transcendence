import React, {useEffect, useState } from 'react'
import axios from 'axios';
import './Form.css'

const CLIENT_ID = process.env.APP_ID || 'u-s4t2ud-b6bbfd6ea348daf72fd11cc6fbe63bad9d5e492ecae19cd689883a6b0f3fdabd';
const REDIRECT_URI = 'http://localhost:3000/form';
const SECRET = process.env.APP_SECRET || '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';

const Form = () => 
{
	const [accessToken, setAccessToken] = useState('');
	const [switchUp, setSwitchUp] = useState(false);
	const [file, setFile] = useState(null);

	const handleFileChange = (event:any) => {
		setFile(event.target.files[0]);
	};

	useEffect(() => {
	const urlParams = new URLSearchParams(window.location.search);
	const code = urlParams.get('code');
	
	if (code) {
		axios.post('https://api.intra.42.fr/oauth/token', {
			grant_type: 'authorization_code',
			client_id: CLIENT_ID,
			client_secret: SECRET,
			code: code,
			redirect_uri: REDIRECT_URI
		})
		.then(response => {
			setAccessToken(response.data.access_token);
		})
		.catch(error => {
			console.error(error);
		});}
	}, []);


	if (accessToken)
	{
		axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
		axios.get('http://localhost:5000/auth') // provide valid auth path
		.then(response => {
			// Handle the response
			console.log(response.data);
		})
		.catch(error => {
			// Handle the error
			console.error(error);
		});
	}

	const handleSwitch = () => {
		setSwitchUp(!switchUp);
	  };

	const cont_style = {
		height: switchUp ? '100vh' : '70vh',
	};

	return (
		<div className='bg'>
		<div className='form-cont' style={cont_style}>
			{ switchUp ? 
			(
			<form name="signup" className='signup-form'>
				<h1>Sign Up</h1>
				<div className='img-cont'>
				{file && <img src={URL.createObjectURL(file)} alt="uploaded image" />}
				</div>
				<label className='label-pic'>
					Upload Profile Picture
					<input type="file" name="pic" onChange={handleFileChange}/>
				</label>
				<label className='label-text'>
					Username:
					<input className='input-text' type="text" name="name" />
				</label>
				<label className='label-text'>
					Password:
					<input className='input-text' type="password" name="pass" />
				</label>
				<label className='submit-lbl'>
					<input className='submit-btn' type="submit" />
				</label>
			</form>
			) : (
			<form name="signin" className='signin-form'>
				<h1>Sign In</h1>
				<label className='label-text'>
					Username:
					<input className='input-text' type="text" name="name" />
				</label>
				<label className='label-text'>
					Password:
					<input className='input-text' type="password" name="pass" />
				</label>
				<label className='submit-lbl'>
					<input className='submit-btn' type="submit" />
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