import Header from "../Header/Header";
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import axios from "axios";
import './Friends.css'

interface User {
	username: string,
	picture: string,
	added: boolean
}

const SearchFriends = () => {

	const session = Cookies.get('session');
	const app_ip = process.env.REACT_APP_IP;

	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(false);
	const [users, setUsers] = useState<User[] | null>([]);
	const [displayUsers, setDisplayUsers] = useState<User[] | null>([]);

	const inputRef = useRef<HTMLInputElement>(null);

	const getImgUrl = (pic: Buffer) => {
		const uintArray = new Uint8Array(pic);
		const blob = new Blob([uintArray], { type: 'mimetype' });
		const imageUrl = URL.createObjectURL(blob);
		return (imageUrl);
	}

	const handleInput = () => {
		const displayable = users?.map((user:User) => {
			if (user.username.slice(0, inputRef.current?.value.length) === inputRef.current?.value)
				return (user);
			return (null);
			});
		setDisplayUsers(displayable?.filter((user) => user !== null) as User[]);
	}

	useEffect(() => {

		const getUserList = async () => {
			setIsLoading(true);
			try {
				const response = await axios.post(`http://${app_ip}:5000/friendship/get_users`, {cookie: session});
				setUsers(response.data.map((user:any) => ({...user, added: false, picture: getImgUrl(user.picture.buffer.data)})));
			} catch (error) {
				console.log(error);
			} finally {
				setIsLoading(false);
			}
		}

		if (!session)
			navigate('/not-logged');
		else
			getUserList();
	}, [navigate, session]);

	const handleAddFriend = async (user: User) => {
		const dispUsrList = displayUsers?.map((usr:User) => {
			if (usr.username === user.username)
				return ({...usr, added: true});
			return (usr);
		});

		setDisplayUsers(dispUsrList?.filter((user) => user !== null) as User[]);

		const usrList = users?.map((usr:User) => {
			if (usr.username === user.username)
				return ({...usr, added: true});
			return (usr);
		});

		setUsers(usrList?.filter((user) => user !== null) as User[]);
		try {
			await axios.post(`http://${app_ip}:5000/friendship/add`, {cookie: session, friendName: user.username});
		} catch (error) {
			console.log(error);
		}
	}

	const spinnerStyle = {
		justifyContent: isLoading ? 'center' : 'flex-start',
	}

	return (
		<>
		<Header />
			<div className="bg">
				<div className="input-wrap">
				<input ref={inputRef} className='search-input' type="text"
				placeholder='Find friends...' onChange={handleInput} disabled={isLoading}/>
				{isLoading && <div className="spinner"/>}
				</div>
				{inputRef.current?.value && !isLoading && 
					<div className="results-cont" style={spinnerStyle}>
						{displayUsers?.map((user, index) => (
							<li key={index} className="user-li">
								<img src={user.picture} alt="profile pic"/>
								<h1>{user.username}</h1>
								{!user.added && <button onClick={() => handleAddFriend(user)}>Add</button>}
								{user.added && <p>Invited</p>}
							</li>
							))}
					</div>
				}
			</div>
		</>
	);
}

export default SearchFriends;