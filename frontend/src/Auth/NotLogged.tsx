import { Link } from "react-router-dom";
import './NotLogged.css'

const NotLogged = () => {

	return (
	  <div className="cont">
		<h1>Not Logged In</h1>
		<Link className="link-btn" to="/">To Homepage</Link>
	  </div>
	);
  }
  
  export default NotLogged;