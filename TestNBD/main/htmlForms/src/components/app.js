import React, { Component } from 'react';
import OS6 from './os6/os6';
import OS4 from './os4/os4';




export default class App extends Component {

	constructor(props) {
		super(props);
		this.state = {
			scheme : 4.0
		}
	}

	componentDidMount() {
		this.setState({
			scheme: window.carriage.result.model
		})
	}

	render() {
		return (
			<div>
				{this.state.scheme == 6 ? < OS6 /> : ''}
				{this.state.scheme == 4 ? <OS4 /> : ''}
			</div>

		);
	}
}