import Header from "../Header/Header";
import './Stats.css'

const Stats = () => {

	return (
		<>
			<Header />
			<div className="bg">
				<div className="stats-cont">
				<h1>Game Stats</h1>
				<table>
					<tbody>
						<tr>
							<td>0</td>
							<td>1</td>
						</tr>
						<tr>
							<td>10</td>
							<td>5</td>
						</tr>
						<tr>
							<td>0</td>
							<td>1</td>
						</tr>
						<tr>
							<td>10</td>
							<td>5</td>
						</tr>
						<tr>
							<td>0</td>
							<td>1</td>
						</tr>
						<tr>
							<td>10</td>
							<td>5</td>
						</tr>
						<tr>
							<td>0</td>
							<td>1</td>
						</tr>
						<tr>
							<td>10</td>
							<td>5</td>
						</tr>
					</tbody>
				</table>
				</div>
			</div>
		</>
	)
}

export default Stats;