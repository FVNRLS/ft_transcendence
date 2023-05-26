import Header from "../Header/Header";
import { useState, useEffect } from 'react';
import axios from "axios";
import Cookies from "js-cookie";
import './Friends.css'
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

interface User {
	username: string,
	picture: string,
	added: boolean
}

const Friends = () => {

	const session = Cookies.get('session');
	const navigate = useNavigate();

	const [isLoading, setIsLoading] = useState(false);
	const [invitators, setInvitators] = useState<User[] | null>([]);
	const [friends, setFriends] = useState<User[] | null>([]);
	const [invitePage, setInvitePage] = useState(false);


	const getImgUrl = (pic: Buffer) => {
		const uintArray = new Uint8Array(pic);
		const blob = new Blob([uintArray], { type: 'mimetype' });
		const imageUrl = URL.createObjectURL(blob);
		return (imageUrl);
	}

	useEffect(() => {
		const getUserList = async () => {
			setIsLoading(true);
			try {
				const response = await axios.post("http://localhost:5000/friendship/get_to_accept", {cookie: session});
				setInvitators(response.data.map((user:any) => ({...user, added: false, picture: getImgUrl(user.picture.buffer.data)})));
				const response1 = await axios.post("http://localhost:5000/friendship/get_accepted", {cookie: session});
				setFriends(response1.data.map((user:any) => ({...user, added: false, picture: getImgUrl(user.picture.buffer.data)})));
			} catch (error) {
				console.log(error);
			} finally {
				setIsLoading(false);
			}
		}
		getUserList();
	}, [session]);

	const acceptFriend = async (user: User) => {
		const invList = invitators?.map((usr:User) => {
			if (usr.username === user.username)
				return ({...usr, added: true});
			return (usr);
		});

		setInvitators(invList?.filter((user) => user !== null) as User[]);
		try {
			await axios.post("http://localhost:5000/friendship/accept", {cookie: session, friendName: user.username});
		} catch (error) {
			console.log(error);
		}
	}

	const deleteFriend = async (user: User) => {
		setFriends(friends?.filter((usr) => usr.username !== user.username) as User[]);

		try {
			await axios.post("http://localhost:5000/friendship/delete", {cookie: session, friendName: user.username});
		} catch (error) {
			console.log(error);
		}
	}

	const rejectFriend = async (user: User) => {
		setInvitators(invitators?.filter((usr) => usr.username !== user.username) as User[]);

		try {
			await axios.post("http://localhost:5000/friendship/reject", {cookie: session, friendName: user.username});
		} catch (error) {
			console.log(error);
		}
	}

	const spinnerStyle = {
		justifyContent: isLoading ? 'center' : 'flex-start',
	}

	const inviteBtnStyle = {
		backgroundColor: invitePage ? 'transparent' : 'rgba(0, 0, 0, 0.1)'
	}

	const friendsBtnStyle = {
		backgroundColor: !invitePage ? 'transparent' : 'rgba(0, 0, 0, 0.1)'
	}

	const divStyle = {
		width: invitePage ? '20%' : '30%',
	}

	return (
		<>
		<Header />
		<div className="bg">
				{invitePage &&
				<div className="results-cont" style={spinnerStyle}>
					{!isLoading && (
						<div className="top-div">
							<button className="top-btn" style={friendsBtnStyle} onClick={() => {setInvitePage(false)}}>Friends</button>
							<button className="top-btn" style={inviteBtnStyle} onClick={() => {setInvitePage(true)}}>Invitations</button>
						</div>
					)}
					{isLoading && <div className="spinner"/>}
					{!isLoading && invitators?.map((user, index) => (
						<li key={index} className="user-li">
							<img src={user.picture} alt="profile pic"/>
							<h1>{user.username}</h1>
							{!user.added && (
								<div style={divStyle}>
									<FontAwesomeIcon className="icon-gr" icon={faCheck}
									size="2x" color="#0fc384b5" onClick={() => {acceptFriend(user)}} />
									<FontAwesomeIcon className="icon-red" icon={faXmark}
								size="2x" color="red" onClick={() => {rejectFriend(user)}} />
								</div>
							)}
							{user.added && <p>Accepted</p>}
						</li>
					))}
				</div>}
				{!invitePage && 
				<div className="results-cont" style={spinnerStyle}>
					{!isLoading && (
						<div className="top-div">
							<button className="top-btn" style={friendsBtnStyle} onClick={() => {setInvitePage(false)}}>Friends</button>
							<button className="top-btn" style={inviteBtnStyle} onClick={() => {setInvitePage(true)}}>Invitations</button>
						</div>
					)}
					{isLoading && <div className="spinner"/>}
					{!isLoading && friends?.map((user, index) => (
						<li key={index} className="user-li">
							<img src={user.picture} alt="profile pic"/>
							<h1>{user.username}</h1>
							<div>
								<button onClick={() => {navigate('/chat')}}>Message</button>
								<FontAwesomeIcon className="icon-red" icon={faXmark}
								size="2x" color="red" onClick={() => {deleteFriend(user)}} />
							</div>
						</li>
					))}
				</div>}
		</div>
		</>
	);
}

export default Friends;