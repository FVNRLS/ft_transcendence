import './Chat.css'
import Header from '../Header/Header';
import Pic from './download.jpeg';

const Chat = () =>
{
	return (
	<>
	<Header />
	<div className='bg'>
		<div className="chat-container">
			<div className="sidebar">
				<div className="profile">
				<img src={Pic} alt="Profile" />
				</div>
				<div className="channels">
				<h3>Channels</h3>
				<ul>
					<li><button>General</button></li>
					<li><button>Random</button></li>
					<li><button>Tech</button></li>
				</ul>
				</div>
				<div className="direct-messages">
				<h3>Direct Messages</h3>
				<ul>
					<li><button>User1</button></li>
					<li><button>User2</button></li>
					<li><button>User3</button></li>
				</ul>
				</div>
			</div>
			<div className="chat">
				<div className="messages">
				<div className="message">
					<img src={Pic} alt="Profile" />
					<div className="message-content">
					<p>Message text goes here.</p>
					<span className="message-time">12:34 PM</span>
					</div>
				</div>
				<div className="message">
					<img src={Pic} alt="Profile" />
					<div className="message-content">
					<p>Another message text goes here.</p>
					<span className="message-time">12:35 PM</span>
					</div>
				</div>
				</div>
				<div className="message-input">
				<input type="text" placeholder="Type a message..." />
				<button>Send</button>
				</div>
			</div>
		</div>
	</div>
	</>
	);
}

export default Chat;