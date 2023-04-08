import Walter from './download.jpeg';

const NotFound = () => {

	return (
		<div style={{display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', alignItems: 'center', backgroundColor: "#1e1e1e", height: '100vh'}}>
			<h1 style={{fontSize: '8rem', color: '#ffffffce', margin: 0}}>404</h1>
			<img src={Walter} alt="Walter" style={{width: '50vw', height: '60vh'}}/>
		</div>
	);
}

export default NotFound;