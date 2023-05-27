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
	const [TFAform, setTFAform] = useState(false);
	const [TFAcode, setTFAcode] = useState('');
	const [switchUp, setSwitchUp] = useState(false);
	const [file, setFile] = useState(null);
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [token, setToken] = useState('');
	const [isBad, setIsBad] = useState(true);

	const navigate = useNavigate();

	const handleFileChange = (event:any) => {
		setFile(event.target.files[0]);
	};

	useEffect(() => {
		const url = new URL(window.location.href);
		const searchParams = new URLSearchParams(url.search);
		const tokenTMP = searchParams.get('token');
		if (tokenTMP)
			setToken(tokenTMP);
		navigate('');
	}, [navigate])

	const sendSignUpData = async (event:any) => {
		event.preventDefault();
		setIsLoading(true);
		let formData = new FormData();
		formData.append('username', username);
		formData.append('password', password);
		formData.append('token_42', token);
		if (file)
			formData.append('file', file);
			try {
				const response = await axios.post('http://localhost:5000/auth/signup', formData, {
					headers: {
					  "Content-Type": "multipart/form-data",
					}});
				if (response.data.status === 201)
				{
					Cookies.set('session', response.data.cookie, { expires: 1 / 24 * 3 });
					navigate('/');
				}
				else
				{
					setIsBad(true);
					setSignUpError(response.data.message);
				}
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
					password: password,
					token_42: token
				});
				if (response.data.status === 201)
				{
					Cookies.set('session', response.data.cookie, { expires: 1 / 24 * 3 });
					navigate('/');
				}
				else if (response.data.status === 202)
				{
					setIsBad(false);
					setSignInError(response.data.message);
					setTFAform(true);
				}
				else
				{
					setIsBad(true);
					setSignInError(response.data.message);
				}
			} catch (error) {
				console.error(error);
			} finally {
				setIsLoading(false);
			}
	}

	const sendTFAcode = async (event:any) => {
		event.preventDefault();
		setIsLoading(true);
		try {
			const response = await axios.post('http://localhost:5000/auth/login_tfa', {
				username: username,
				password: password,
				TFACode: TFAcode,
				token_42: token,
			});
			if (response.data.status === 201)
			{
				Cookies.set('session', response.data.cookie, { expires: 1 / 24 * 3 });
				navigate('/');
			}
			else
			{
				setIsBad(true);
				setSignInError(response.data.message);
			}
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

	const messageStyle = {
		color: isBad ? '#f53939' : '#16A892',
	};

	const handleUsernameChange = (event:any) => {
		setUsername(event.target.value);
	}

	const handlePasswordChange = (event:any) => {
		setPassword(event.target.value);
	}

	const handleTFAcodeChange = (event:any) => {
		setTFAcode(event.target.value);
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
			<>
				{!TFAform ? 
				(
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
				) :
				(
					<form name="signin" className='signin-form'>
					<h1>Provide a TFA code</h1>
					{signInError && <h2 style={messageStyle}>{signInError}</h2>}
						<label className='label-text'>
							Code:
							<input className='input-text' type="text" name="code" onChange={handleTFAcodeChange}/>
						</label>
						<label className='submit-lbl'>
							<input className='submit-btn' type="submit" onClick={sendTFAcode}/>
						</label>
					</form>
				)}
				
			</>
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