import React, { Component } from "react";
import Tooltip from '../tooltips';
import Truck1 from './truck1';
import Truck2 from './truck2';
import Truck3 from './truck3';


class OS6 extends Component{

	constructor(props) {
		super(props);

		this.state = {
			title: 'название модуля',
			positionTooltipsX: 0,
			positionTooltipsY: 0,
			numberCarriage : '',
		/*Установка автосцепного устройства*/
			emphasisFrontAndRearObed: false,
			tractionClamp: false,
			absorberHousing: false,
			lock1: false,
			autoCouplingHousing: false,
			rollerLift: false,
		/*Установка автосцепного устройства 2*/
			emphasisFrontAndRearObed2: false,
			tractionClamp2: false,
			absorberHousing2: false,
			lock2: false,
			autoCouplingHousing2: false,
			rollerLift2: false,
		/*крышки люков*/
			lidL1: false,
			lidL2: false,
			lidL3: false,
			lidR3: false,
			lidR4: false,
			lidL4: false,
			lidL6: false,
			lidL7: false,
			lidR6: false,
			lidR7: false,
			lidL5: false,
			lidR5: false,
			air: false,
			lidR1: false,
			lidR2: false,
			autoMode1: false,
			autoMode2: false,

		}

		this.handleOnMouse = this.handleOnMouse.bind(this);
	}

	componentDidMount() {
		if (window.otherElements) {
			this.setState(window.otherElements);
			this.setState({ numberCarriage: window.carriage.result.number });
		}
	}

	handleOnMouse(e) {
		this.setState({ title: e.target.getAttribute('title') });
		this.setState({ positionTooltipsX: e.pageX, positionTooltipsY: e.pageY});
	}

	render() {
		return (
			<div className="scheme">
				<p>Номер вагона: {this.state.numberCarriage}</p>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					x="0"
					y="0"
					baseProfile="tiny"
					version="1.2"
					viewBox="0 0 3006 5067"
					title="Схема грузового вагона (6-осного)"
					id="os6"
					onMouseOver={this.handleOnMouse}>
					<Truck1 />
					<Truck2 />
					<Truck3 />
					<g>
						{/*Установка автосцепного устройства*/}
						<g>
							<path
								fill="#F2F2F2"
								stroke="#000"
								strokeMiterlimit="10"
								d="M1080 36H1944V414H1080z"
								title="Установка автосцепного устройства"
								id="installingTheCoupler"
							></path>
							{/*Упоры передний и задний объед.*/}
							<path
								style={{ fill: this.state.emphasisFrontAndRearObed ? '#DEEAD4' : 'red' }}
								d="M1368.5 73.5H1655.5V107.5H1368.5z"
								title="Упоры передний и задний объед."
								id="emphasisFrontAndRearObed"
							></path>
							<path d="M1655 74v33h-286V74h286m1-1h-288v35h288V73z"></path>
							{/*Хомут тяговый 1*/}
							<path
									style={{ fill: this.state.tractionClamp ? '#DEEAD4' : 'red' }}
								d="M1368.5 126.5H1655.5V160.5H1368.5z"
								title="Хомут тяговый 1"
								id="tractionClamp"
								></path>
							<path d="M1655 127v33h-286v-33h286m1-1h-288v35h288v-35z"></path>
							{/*Поглощающий аппарат 1*/}
							<path
								fill="#E6E6E6"
								d="M1152.5 180.5H1871.5V269.5H1152.5z"
								title="Поглощающий аппарат 1"
								id="absorber"
							></path>
							<path d="M1871 181v88h-718v-88h718m1-1h-720v90h720v-90z"></path>
							{/*Корпус поглощающего аппарата 1*/}
							<path
									style={{ fill: this.state.absorberHousing ? '#DEEAD4' : 'red' }}
								d="M1224.5 208.5H1799.5V242.5H1224.5z"
								title="Корпус поглощающего аппарата 1"
								id="absorberHousing"
								></path>
							<path d="M1799 209v33h-574v-33h574m1-1h-576v35h576v-35z"></path>
							{/*Автосцепка 1*/}
							<g>
								<path
									fill="#E6E6E6"
									d="M1152.5 288.5H1871.5V377.5H1152.5z"
									title="Автосцепка 1"
									id="autoCoupler"
								></path>
								<path d="M1871 289v88h-718v-88h718m1-1h-720v90h720v-90z"></path>
							</g>
							{/*Замок 1*/}
							<path
									style={{ fill: this.state.lock1 ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1224 315H1404V351H1224z"
								title="Замок 1"
								id="lock1"
							></path>
							{/*Корпус автосцепки*/}
							<path
									style={{ fill: this.state.autoCouplingHousing ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1404 315H1620V351H1404z"
								title="Корпус автосцепки"
								id="autoCouplingHousing"
							></path>
							{/*Валик подъем.*/}
							<path
									style={{ fill: this.state.rollerLift ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1620 315H1800V351H1620z"
								title="Валик подъем."
								id="rollerLift"
							></path>
						</g>

						{/*Установка автосцепного устройства 2*/}
						<g>
							<path
								fill="#F2F2F2"
								stroke="#000"
								strokeMiterlimit="10"
								d="M1089 4356H1953V4734H1089z"
								title="Установка автосцепного устройства 2"
								id="installingTheCoupler"
							></path>
							{/*Упоры передний и задний объед. 2*/}
							<path
									style={{ fill: this.state.emphasisFrontAndRearObed2 ? '#DEEAD4' : 'red' }}
								d="M1377.5 4662.5H1664.5V4696.5H1377.5z"
								title="Упоры передний и задний объед. 2"
								id="emphasisFrontAndRearObed2"
							></path>
							<path d="M1664 4663v33h-286v-33h286m1-1h-288v35h288v-35z"></path>
							{/*Хомут тяговый 2*/}
							<path
									style={{ fill: this.state.tractionClamp2 ? '#DEEAD4' : 'red' }}
								d="M1377.5 4609.5H1664.5V4643.5H1377.5z"
								title="Хомут тяговый 2"
								id="tractionClamp2"
							></path>
							<path d="M1664 4610v33h-286v-33h286m1-1h-288v35h288v-35z"></path>
							{/*Поглощающий аппарат 2*/}
							<path
								fill="#E6E6E6"
								d="M1161.5 4500.5H1880.5V4589.5H1161.5z"
								title="Поглощающий аппарат 2"
								id="absorber2"
							></path>
							<path d="M1880 4501v88h-718v-88h718m1-1h-720v90h720v-90z"></path>
							{/*Корпус поглощающего аппарата 2*/}
							<path
									style={{ fill: this.state.absorberHousing2 ? '#DEEAD4' : 'red' }}
								d="M1233.5 4527.5H1808.5V4561.5H1233.5z"
								title="Корпус поглощающего аппарата 2"
								id="absorberHousing2"
							></path>
							<path d="M1808 4528v33h-574v-33h574m1-1h-576v35h576v-35z"></path>
							{/*Автосцепка 2*/}
							<g>
								<path
									fill="#E6E6E6"
									d="M1161.5 4392.5H1880.5V4481.5H1161.5z"
									title="Автосцепка 2"
									id="autoCoupler2"
								></path>

								<path d="M1880 4393v88h-718v-88h718m1-1h-720v90h720v-90z"></path>
							</g>
							{/*Замок 2*/}
							<path
									style={{ fill: this.state.lock2 ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1233 4419H1413V4455H1233z"
								title="Замок 2"
								id="lock2"
							></path>
							{/*Корпус автосцепки 2*/}
							<path
									style={{ fill: this.state.autoCouplingHousing2 ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1413 4419H1629V4455H1413z"
								title="Корпус автосцепки 2"
								id="autoCouplingHousing2"
							></path>
							{/*Валик подъем. 2*/}
							<path
									style={{ fill: this.state.rollerLift2 ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1629 4419H1809V4455H1629z"
								title="Валик подъем.2"
								id="rollerLift2"
							></path>
						</g>
						{/*"Крышкалюка L1"*/}
						<path
								style={{ fill: this.state.lidL1 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M279 450H351.5V531H279z"
							title="Крышкалюка L1"
							id="lidL1"
						></path>
						{/*"Крышкалюка L2"*/}
						<path
								style={{ fill: this.state.lidL2 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M279 1170H351.5V1278H279z"
							title="Крышкалюка L2"
							id="lidL2"
						></path>
						{/*"Крышкалюка L3"*/}
						<path
								style={{ fill: this.state.lidL3 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M279 2106H351.5V2214H279z"
							title="Крышкалюка L3"
							id="lidL3"
						></path>
						{/*"Крышкалюка R3"*/}
						<path
								style={{ fill: this.state.lidR3 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 2106H2727V2214H2654.5z"
							title="Крышкалюка R3"
							id="lidR3"
						></path>
						{/*"Крышкалюка R4"*/}
						<path
								style={{ fill: this.state.lidR4 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2655 2646H2727.5V2754H2655z"
							title="Крышкалюка R4"
							id="lidR4"
						></path>
						{/*"Крышкалюка L4"*/}
						<path
								style={{ fill: this.state.lidL4 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M279 2646H351.5V2754H279z"
							title="Крышкалюка L4"
							id="lidL4"
						></path>
						{/*"Крышкалюка L6"*/}
						<path
								style={{ fill: this.state.lidL6 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M279 3672H351.5V3789H279z"
							title="Крышкалюка L6"
							id="lidL6"
						></path>
						{/*"Крышкалюка L7"*/}
						<path
								style={{ fill: this.state.lidL7 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M278.5 4239H351V4320H278.5z"
							title="Крышкалюка L7"
							id="lidL7"
						></path>
						{/*"Крышкалюка R6"*/}
						<path
								style={{ fill: this.state.lidR6 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 3672H2727V3789H2654.5z"
							title="Крышкалюка R6"
							id="lidR6"
						></path>
						{/*"Крышкалюка R7"*/}
						<path
								style={{ fill: this.state.lidR7 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654 4239H2726.5V4320H2654z"
							title="Крышкалюка R7"
							id="lidR7"
						></path>
						{/*"Крышкалюка L5"*/}
						<path
								style={{ fill: this.state.lidL5 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M278.5 3069H351V3357H278.5z"
							title="Крышкалюка L5"
							id="lidL5"
						></path>
						{/*"Крышкалюка R5"*/}
						<path
								style={{ fill: this.state.lidR5 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 3069H2727V3357H2654.5z"
							title="Крышкалюка R5"
							id="lidR5"
						></path>
						{/*Воздухор.*/}
						<path
								style={{ fill: this.state.air ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M126 450H243V4320H126z"
							title="Воздухор"
							id="air"
						></path>
						{/*"Крышкалюка R1"*/}
						<path
								style={{ fill: this.state.lidR1 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 450H2727V531H2654.5z"
							transform="rotate(-180 2690.75 490.5)"
							title="Крышкалюка R1"
							id="lidR1"
						></path>
						{/*"Крышкалюка R2"*/}
						<path
								style={{ fill: this.state.lidR2 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 1170H2727V1269H2654.5z"
							transform="rotate(-180 2690.75 1219.5)"
							title="Крышкалюка R2"
							id="lidR2"
						></path>
						{/*Авторежим 1*/}
						<path
								style={{ fill: this.state.autoMode1 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2762.5 450H2880V1728H2762.5z"
							transform="rotate(-180 2821.25 1089)"
							title="Авторежим 1"
							id="autoMode1"
						></path>
						{/*Авторежим 2*/}
						<path
								style={{ fill: this.state.autoMode2 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2763 2988H2835.5V4320H2763z"
							transform="rotate(-180 2799.25 3654)"
							title="Авторежим 2"
							id="autoMode2"
						></path>
					</g>
					</svg>
					<Tooltip options={this.state}/>
			</div>
		);
	}
}

export default OS6;
