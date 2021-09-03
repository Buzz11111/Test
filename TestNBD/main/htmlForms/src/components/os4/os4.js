import React, { Component } from "react";
import Tooltip from '../tooltips';
import Truck1 from './truck1';
import Truck2 from './truck2';

export default class OS4 extends Component {

	constructor(props) {
		super(props);

		this.state = {
			title: 'название модуля',
			positionTooltipsX: 0,
			positionTooltipsY: 0,
			uin: '',
			numberCarriage: '',
			/*Установка автосцепного устройства*/
			emphasisFrontAndRearObed: {},
			tractionClamp: {},
			absorberHousing: {},
			lock1: {},
			autoCouplingHousing: {},
			rollerLift: {},
			/*Установка автосцепного устройства 2*/
			emphasisFrontAndRearObed2: {},
			tractionClamp2: {},
			absorberHousing2: {},
			lock2: {},
			autoCouplingHousing2: {},
			rollerLift2: {},
			/*крышки люков*/
			lidL1: {},
			lidL2: {},
			lidL3: {},
			lidR3: {},
			lidR4: {},
			lidL4: {},
			lidL6: {},
			lidL7: {},
			lidR6: {},
			lidR7: {},
			lidL5: {},
			lidR5: {},
			air: false,
			lidR1: false,
			lidR2: false,
			autoMode1: {},
			autoMode2: {},
		}

		this.handleOnMouse = this.handleOnMouse.bind(this);
	}

	componentDidMount() {
		if (window.carriage) {
			this.setState({
				numberCarriage: window.carriage.result.number,
				tractionClamp: window.carriage.result.traction_clamp[0],
				tractionClamp2: window.carriage.result.traction_clamp[1],
				absorberHousing: window.carriage.result.absorbing_device_body[0],
				absorberHousing2: window.carriage.result.absorbing_device_body[1],
				lidL1: window.carriage.result.gondola_hatch[0],
				lidL2: window.carriage.result.gondola_hatch[1],
				lidL3: window.carriage.result.gondola_hatch[2],
				lidR3: window.carriage.result.gondola_hatch[3],
				lidR4: window.carriage.result.gondola_hatch[4],
				lidL4: window.carriage.result.gondola_hatch[5],
				lidL6: window.carriage.result.gondola_hatch[6],
				lidL7: window.carriage.result.gondola_hatch[7],
				lidR6: window.carriage.result.gondola_hatch[8],
				lidR7: window.carriage.result.gondola_hatch[9],
				lidL5: window.carriage.result.gondola_hatch[10],
				lidR5: window.carriage.result.gondola_hatch[11],
				lidR1: window.carriage.result.gondola_hatch[12],
				lidR2: window.carriage.result.gondola_hatch[13],
				emphasisFrontAndRearObed: window.carriage.result.front_rear_detents[0],
				emphasisFrontAndRearObed2: window.carriage.result.front_rear_detents[1],
				autoCouplingHousing: window.carriage.result.auto_coupler[0],
				autoCouplingHousing2: window.carriage.result.auto_coupler[1],
				rollerLift:  window.carriage.result.elevator_roll[0],
				rollerLift2: window.carriage.result.elevator_roll[1],
				lock1: window.carriage.result.lock[0],
				lock2: window.carriage.result.lock[1],
				autoMode1: window.carriage.result.auto_mode_cargo[0],
				autoMode2: window.carriage.result.auto_mode_cargo[1],
			});
			this.setState(window.otherElements);
		}
	}

	handleOnMouse(e) {
		this.setState({ title: e.target.getAttribute('title') });
		this.setState({ uin: e.target.getAttribute('uin') });
		this.setState({ positionTooltipsX: e.pageX, positionTooltipsY: e.pageY });
	}


	render() {

		return (
			<div>
				<p>Номер вагона: {this.state.numberCarriage}</p>
				
				<svg
					xmlns="http://www.w3.org/2000/svg"
					x="0"
					y="0"
					baseProfile="tiny"
					version="1.2"
					viewBox="0 0 3006 3556.8"
					title="Схема грузового вагона (4-осного)"
					onMouseOver={this.handleOnMouse}
				>
					<Truck1 />
					<Truck2 />
					<g>	
						{/*Тележка 2*/}


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
								title={this.state.emphasisFrontAndRearObed ? this.state.emphasisFrontAndRearObed.name + ' ' + this.state.emphasisFrontAndRearObed.position : "Упоры передний и задний объед."}
								uin={this.state.emphasisFrontAndRearObed ? this.state.emphasisFrontAndRearObed.uin : ''}
								id="emphasisFrontAndRearObed"
							></path>
							<path d="M1655 74v33h-286V74h286m1-1h-288v35h288V73z"></path>
							{/*Хомут тяговый 1*/}
							<path
								style={{ fill: this.state.tractionClamp && this.state.tractionClamp.position? '#DEEAD4' : 'red' }}
								d="M1368.5 126.5H1655.5V160.5H1368.5z"
								title={this.state.tractionClamp ? this.state.tractionClamp.name : "Хомут тяговый"}
								uin={this.state.tractionClamp ? this.state.tractionClamp.uin : ''}
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
								title={this.state.absorberHousing ? this.state.absorberHousing.name + ' ' + this.state.absorberHousing.position : "Корпус поглощающего аппарата 1"}
								uin={this.state.absorberHousing ? this.state.absorberHousing.uin : ""}
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
								title={this.state.lock1 ? this.state.lock1.name + ' ' + this.state.lock1.position : "Замок 1"}
								uin={this.state.lock1 ? this.state.lock1.uin : ''}
								id="lock1"
							></path>
							{/*Корпус автосцепки*/}
							<path
								style={{ fill: this.state.autoCouplingHousing ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1404 315H1620V351H1404z"
								title={this.state.autoCouplingHousing ? this.state.autoCouplingHousing.name + ' ' + this.state.autoCouplingHousing.position : "Корпус автосцепки"}
								uin={this.state.autoCouplingHousing ? this.state.autoCouplingHousing.uin : ''}
							id="autoCouplingHousing"
							></path>
							{/*Валик подъем.*/}
							<path
								style={{ fill: this.state.rollerLift ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1620 315H1800V351H1620z"
								title={this.state.rollerLift ? this.state.rollerLift.name + ' ' + this.state.rollerLift.position : "Валик подъем."}
								uin={this.state.rollerLift ? this.state.rollerLift.uin : ''}
								id="rollerLift"
							></path>
						</g>
						{/*Установка автосцепного устройства 2*/}
						<g>
							<path
								fill="#F2F2F2"
								stroke="#000"
								strokeMiterlimit="10"
								d="M999 2988.2H1863V3366.2H999z"
								title="Установка автосцепного устройства 2"
								id="installingTheCoupler"
							></path>
							{/*Упоры передний и задний объед. 2*/}
							<path
								style={{ fill: this.state.emphasisFrontAndRearObed2 ? '#DEEAD4' : 'red' }}
								d="M1287.5 3294.7H1574.5V3328.7H1287.5z"
								title="Упоры передний и задний объед. 2"
								id="emphasisFrontAndRearObed2"
							></path>
							<path d="M1574 3295.2v33h-286v-33h286m1-1h-288v35h288v-35z"></path>
							{/*Хомут тяговый 2*/}
							<path
								style={{ fill: this.state.tractionClamp2 ? '#DEEAD4' : 'red' }}
								d="M1287.5 3241.7H1574.5V3275.7H1287.5z"
								title={this.state.tractionClamp2 ? this.state.tractionClamp2.name + ' ' + this.state.tractionClamp2.position : "Хомут тяговый 2"}
								uid={this.state.tractionClamp2 ? this.state.tractionClamp2.uin : ""}
								id="tractionClamp2"
							></path>
							<path d="M1574 3242.2v33h-286v-33h286m1-1h-288v35h288v-35z"></path>
							{/*Поглощающий аппарат 2*/}
							<path
								fill="#E6E6E6"
								d="M1071.5 3132.7H1790.5V3221.7H1071.5z"
								title="Поглощающий аппарат 2"
								id="absorber2"
							></path>
							<path d="M1790 3133.2v88h-718v-88h718m1-1h-720v90h720v-90z"></path>
							{/*Корпус поглощающего аппарата 2*/}
							<path
								style={{ fill: this.state.absorberHousing2 ? '#DEEAD4' : 'red' }}
								d="M1143.5 3159.7H1718.5V3193.7H1143.5z"
								title={this.state.absorberHousing2 ? this.state.absorberHousing2.name + ' ' + this.state.absorberHousing2.position : "Корпус поглощающего аппарата 2"}
								uin={this.state.absorberHousing2 ? this.state.absorberHousing2.uin : ""}
								id="absorberHousing2"
							></path>
							<path d="M1718 3160.2v33h-574v-33h574m1-1h-576v35h576v-35z"></path>
							{/*Автосцепка 2*/}
							<g>
								<path
									fill="#E6E6E6"
									d="M1071.5 3024.7H1790.5V3113.7H1071.5z"
									title="Автосцепка 2"
									id="autoCoupler2"
								></path>
								<path d="M1790 3025.2v88h-718v-88h718m1-1h-720v90h720v-90z"></path>
							</g>
							{/*Замок 2*/}
							<path
								style={{ fill: this.state.lock2 ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1143 3051.2H1323V3087.2H1143z"
								title="Замок 2"
								id="lock2"
							></path>
							{/*Корпус автосцепки 2*/}
							<path
								style={{ fill: this.state.autoCouplingHousing2 ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1323 3051.2H1539V3087.2H1323z"
								title="Корпус автосцепки 2"
								id="autoCouplingHousing2"
							></path>
							{/*Валик подъем. 2*/}
							<path
								style={{ fill: this.state.rollerLift2 ? '#DEEAD4' : 'red' }}
								stroke="#000"
								strokeMiterlimit="10"
								d="M1539 3051.2H1719V3087.2H1539z"
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
							title={this.state.lidL1 ? this.state.lidL1.name + ' ' + this.state.lidL1.position : "Крышкалюка L1"}
							uin={this.state.lidL1 ? this.state.lidL1.uin : ''}
							id="lidL1"
						></path>
						{/*"Крышкалюка L2"*/}
						<path
							style={{ fill: this.state.lidL2 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M279 575.8H351.5V683.8H279z"
							title={this.state.lidL2 ? this.state.lidL2.name + ' ' + this.state.lidL2.position : "Крышкалюка L2"}
							uin={this.state.lidL2 ? this.state.lidL2.uin : ''}
							id="lidL2"
						></path>
						{/*"Крышкалюка L3"*/}
						<path
							style={{ fill: this.state.lidL3 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M279 1538.5H351.5V1646.5H279z"
							title={this.state.lidL3 ? this.state.lidL3.name + ' ' + this.state.lidL3.position : "Крышкалюка L3"}
							uin={this.state.lidL3 ? this.state.lidL3.uin : ''}
							id="lidL3"
						></path>
						{/*"Крышкалюка R3"*/}
						<path
							style={{ fill: this.state.lidR3 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 1538.5H2727V1646.5H2654.5z"
							title="Крышкалюка R3"
							id="lidR3"
						></path>
						{/*"Крышкалюка L4"*/}
						<path
							style={{ fill: this.state.lidL4 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M279 1781.2H351.5V1889.2H279z"
							title="Крышкалюка L4"
							id="lidL4"
						></path>
						{/*"Крышкалюка L5"*/}
						<path
							style={{ fill: this.state.lidL5 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M278.5 2123.7H351V2231.7H278.5z"
							title="Крышкалюка L5"
							id="lidL5"
						></path>
						{/*"Крышкалюка L6"*/}
						<path
							style={{ fill: this.state.lidL6 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M278.5 2483.7H351V2582.7H278.5z"
							title="Крышкалюка L6"
							id="lidL6"
						></path>
						{/*"Крышкалюка L7"*/}
						<path
							style={{ fill: this.state.lidL7 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M278.5 2861.7H351V2960.7H278.5z"
							title="Крышкалюка L7"
							id="lidL7"
						></path>
						{/*"Крышкалюка R4"*/}
						<path
							style={{ fill: this.state.lidR4 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 1783.1H2727V1891.1H2654.5z"
							title="Крышкалюка R4"
							id="lidR4"
						></path>
						{/*"Крышкалюка R5"*/}
						<path
							style={{ fill: this.state.lidR5 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 2124.1H2727V2232.1H2654.5z"
							title="Крышкалюка R5"
							id="lidR5"
						></path>
						{/*"Крышкалюка R6"*/}
						<path
							style={{ fill: this.state.lidR6 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 2483H2727V2582.7H2654.5z"
							title="Крышкалюка R6"
							id="lidR6"
						></path>
						{/*"Крышкалюка R7"*/}
						<path
							style={{ fill: this.state.lidR7 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2654.5 2862H2727V2961.7H2654.5z"
							title="Крышкалюка R7"
							id="lidR7"
						></path>
						{/*Воздухор.*/}
						<path
							style={{ fill: this.state.air ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M126 450H243V2960.7H126z"
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
							d="M2654.5 575.8H2727V674.8H2654.5z"
							transform="rotate(-180 2690.75 625.25)"
							title="Крышкалюка R2"
							id="lidR2"
						></path>
						{/*Авторежим 1*/}
						<path
							style={{ fill: this.state.autoMode1 ? '#DEEAD4' : 'red' }}
							stroke="#000"
							strokeMiterlimit="10"
							d="M2762.5 450H2880V2960.7H2762.5z"
							transform="rotate(-180 2821.25 1705.333)"
							title={this.state.autoMode1 ? this.state.autoMode1.name + ' ' + this.state.autoMode1.position : "Авторежим 1"}
							uin={this.state.autoMode1 ? this.state.autoMode1.uin : ''}
							id="autoMode1"
						></path>
					</g>
					</svg>
				<Tooltip options={this.state} />
			</div>
		);
	}
}
