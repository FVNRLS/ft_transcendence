import './Chat.css'
import Header from '../Header/Header';

const Chat = () =>
{
	const name = 'Sample';

	return (
		<div className='bg'>
			<Header />
			<div className='chat-cont'>
				<section className='left-sect'>
					<h1>Chat</h1>
					<section>
						<ul>
							<li>{name}</li>
							<button className='plus-btn' />
						</ul>	
					</section>
				</section>
				<section className='right-sect'>
					<section></section>
					<input className='msg-input' placeholder='Write a message...'/>
				</section>
			</div>
		</div>
	);
}

export default Chat;