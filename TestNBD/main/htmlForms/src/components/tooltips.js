import React, { Component } from 'react';

export default class Tooltip extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div
				className="tooltip-wrapper"
				style={
					{
						position: 'absolute',
						left: this.props.options.positionTooltipsX,
						top: this.props.options.positionTooltipsY,
						background: '#fff',
						padding: '10px',
						border: '1px solid #000',
						pointerEvents: 'none'
					}
				}
			>
				<p>{this.props.options.title}</p>
				<p>{this.props.options.uin}</p>
			</div>
			);
	}
}