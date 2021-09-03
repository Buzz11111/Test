import React, { Component } from 'react';

export default class Truck2 extends Component {
	constructor(props) {
		super(props);

		this.state = {
			truck2WheelsWhithoutStopNodeAxis1: false,
			truck2WheelsWhithoutStopNodeAxis2: false,
			truck2Wheels1Wheel1: false,
			truck2Wheels1Wheel2: false,
			truck2Wheels1Bearing1: false,
			truck2Wheels1Bearing2: false,
			truck2Wheels2WhithoutStopNodeAxis1: false,
			truck2Wheels2WhithoutStopNodeAxis2: false,
			truck2Wheels2Wheel1: false,
			truck2Wheels2Wheel2: false,
			truck2Wheels2Bearing1: false,
			truck2Wheels2Bearing2: false,
			truck2BearingAdapterL3: false,
			truck2BearingAdapterR3: false,
			truck2BearingAdapterL4: false,
			truck2BearingAdapterR4: false,
			truck2SideframeInL1: false,
			truck2SideframeInL2: false,
			truck2SideframeStapleL3: false,
			truck2SideframeStapleL4: false,
			truck2SideframeFrictionStripL3: false,
			truck2SideframeFrictionStripL4: false,
			truck2NadressornybeamPlastl5: false,
			truck2NadressornybeamInsertl5: false,
			truck2NadressornybeamPlastl6: false,
			truck2NadressornybeamRing: false,
			truck2NadressornybeamPlastR6: false,
			truck2NadressornybeamInsertR3: false,
			truck2NadressornybeamPlastR5: false,
			truck2NadressornybeamBotoomPlastL7: false,
			truck2NadressornybeamBotoomInsertL4: false,
			truck2NadressornybeamBotoomPlastL8: false,
			truck2NadressornybeamBotoomPlastR8: false,
			truck2NadressornybeamBotoomInsertR4: false,
			truck2NadressornybeamBotoomPlastR7: false,
			truck2SliderLHead: false,
			truck2SliderLInside: false,
			truck2SliderLBody: false,
			truck2SliderL2Head: false,
			truck2SliderL2Inside: false,
			truck2SliderL2Body: false,
			truck2SliderR2Head: false,
			truck2SliderR2Inside: false,
			truck2SliderR2Body: false,
			truck2SliderRHead: false,
			truck2SliderRInside: false,
			truck2SliderRBody: false,
			truck2WedgeL6: false,
			truck2WedgeL8: false,
			truck2InsideSpringL12: false,
			truck2InsideSpringL15: false,
			truck2InsideSpringL18: false,
			truck2WedgeL5: false,
			truck2WedgeL7: false,
			truck2InsideSpringL11: false,
			truck2InsideSpringL14: false,
			truck2InsideSpringL17: false,
			truck2InsideSpringL10: false,
			truck2InsideSpringL13: false,
			truck2InsideSpringL16: false,
			truck2SideframeR: false,
			truck2SideframeR2: false,
			truck2SideframeStapleR3: false,
			truck2SideframeStapleR4: false,
			truck2SideframeFrictionStripR3: false,
			truck2SideframeFrictionStripR4: false,
			truck2WedgeR6: false,
			truck2WedgeR8: false,
			truck2InsideSpringR12: false,
			truck2InsideSpringR15: false,
			truck2InsideSpringR18: false,
			truck2Wedger5: false,
			truck2Wedger7: false,
			truck2InsideSpringR11: false,
			truck2InsideSpringR14: false,
			truck2InsideSpringR17: false,
			truck2InsideSpringR10: false,
			truck2InsideSpringR13: false,
			truck2InsideSpringR16: false,
			truck2ThrustBearing2: false,
			truck2Nadressornybeam2: false,
		}

	}

	componentDidMount() {
		if (window.truck2Data) {
			this.setState(window.truck2Data);
		}
	}

	render() {
		return (
			<g>
				<path
					fill="#F2F2F2"
					stroke="#000"
					strokeMiterlimit="10"
					d="M387 1727.7H2619V2960.7H387z"
					title="Тележка 2"
					id="truck2"
				></path>
				<path
					fill="#F2F2F2"
					d="M423.5 1764.2H2582.5V2042.2H423.5z"
					title="Колесная пара 3"
					id="truck2Wheels3"
				></path>
				<path d="M2582 1764.7v277H424v-277h2158m1-1H423v279h2160v-279z"></path>
				<path
					fill="#E6E6E6"
					stroke="#000"
					strokeMiterlimit="10"
					d="M567 1790.7H2439V2015.7H567z"
					title="Колесная пара без буксовых узлов 1"
					id="truck2WheelsWhithoutStopNode"
				></path>
				<path
					style={{ fill: this.state.truck2WheelsWhithoutStopNodeAxis1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M693 1853.7H2295V1889.2H693z"
					title="Ось чистовая"
					id="truck2WheelsWhithoutStopNodeAxis1"
				></path>
				<path
					style={{ fill: this.state.truck2WheelsWhithoutStopNodeAxis2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M693 1889.2H2295V1925.7H693z"
					title="Ось чистовая"
					id="truck2WheelsWhithoutStopNodeAxis2"
				></path>
				<path
					style={{ fill: this.state.truck2Wheels1Wheel1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M639 1817.7H711V1925.7H639z"
					title="Колесо"
					id="truck2Wheels1Wheel1"
				></path>
				<path
					style={{ fill: this.state.truck2Wheels1Wheel2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M2295 1817.7H2367V1925.7H2295z"
					title="Колесо"
					id="truck2Wheels1Wheel2"
				></path>
				<path
					style={{ fill: this.state.truck2Wheels1Bearing1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M494.5 1853.7H567V1889.7H494.5z"
					title="Подшипник"
					id="truck2Wheels1Bearing1"
				></path>
				<path
					style={{ fill: this.state.truck2Wheels1Bearing2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M2439 1853.7H2512V1889.7H2439z"
					title="Подшипник"
					id="truck2Wheels1Bearing2"
				></path>
				{/*колесная пара 2*/}
				<g>
					<path fill="#F2F2F2"
						d="M423.5 2646.2H2582.5V2924.2H423.5z"
						title="Колесная пара 4"
						id="truck2Wheels2"
					></path>
					<path d="M2582 2646.7v277H424v-277h2158m1-1H423v279h2160v-279z"></path>
					<path
						fill="#E6E6E6"
						stroke="#000"
						strokeMiterlimit="10"
						d="M567 2672.7H2439V2897.7H567z"
						title="Колесная пара без буксовых узлов 2"
						id="truck2Wheels2WhithoutStopNode"
					></path>
					<path
						style={{ fill: this.state.truck2Wheels2WhithoutStopNodeAxis1 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M693 2735.7H2295V2771.2H693z"
						title="Ось чистовая"
						id="truck2Wheels2WhithoutStopNodeAxis1"
					></path>
					<path
						style={{ fill: this.state.truck2Wheels2WhithoutStopNodeAxis2 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M693 2771.2H2295V2807.7H693z"
						title="Ось чистовая"
						id="truck2Wheels2WhithoutStopNodeAxis2"
					></path>
					<path
						style={{ fill: this.state.truck2Wheels2Wheel1 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M639 2699.7H711V2807.7H639z"
						title="Колесо"
						id="truck2Wheels2Wheel1"
					></path>
					<path
						style={{ fill: this.state.truck2Wheels2Wheel2 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M2295 2699.7H2367V2807.7H2295z"
						title="Колесо"
						id="truck2Wheels2Wheel2"
					></path>
					<path
						style={{ fill: this.state.truck2Wheels2Bearing1 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M494.5 2735.7H567V2771.7H494.5z"
						title="Подшипник"
						id="truck2Wheels2Bearing1"
					></path>
					<path
						style={{ fill: this.state.truck2Wheels2Bearing2 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M2439 2735.7H2512V2771.7H2439z"
						title="Подшипник"
						id="truck2Wheels2Bearing2"
					></path>
				</g>
				<g stroke="#000" strokeMiterlimit="10">
					{/*адапрет подшипника*/}
					<path
						style={{ fill: this.state.truck2BearingAdapterL3 ? '#DEEAD4' : 'red' }}
						d="M765 2042.2H837V2105.7H765z"
						title="Адаптер подшипника L3"
						id="truck2BearingAdapterL3"
					></path>
					<path
						style={{ fill: this.state.truck2BearingAdapterR3 ? '#DEEAD4' : 'red' }}
						d="M2187 2042.2H2259V2105.7H2187z"
						transform="rotate(-180 2223 2073.917)"
						title="Адаптер подшипника R3"
						id="truck2BearingAdapterR3"
					></path>
					{/*Балка надрессорная*/}
					<path
						fill="#E6E6E6"
						d="M1125 2195.7H1917V2501.7H1125z"
						title="Балка надрессорная"
						id="truck2Nadressornybeam"
					></path>
					{/*Скользун l*/}
					<path
						fill="#E6E6E6"
						d="M873 2195.7H1125V2501.7H873z"
						title="Скользун L2"
						id="truck2SliderL2"
					></path>
					{/*Скользун r*/}
					<path
						fill="#E6E6E6"
						d="M1917 2195.7H2151V2501.7H1917z"
						title="Скользун R2"
						id="truck2SliderR2"
					></path>
					{/*адапрет подшипника*/}
					<path
						style={{ fill: this.state.truck2BearingAdapterL4 ? '#DEEAD4' : 'red' }}
						d="M765 2582.7H837V2646.2H765z"
						title="Адаптер подшипника L4"
						id="truck2BearingAdapterL4"
					></path>
					<path
						style={{ fill: this.state.truck2BearingAdapterR4 ? '#DEEAD4' : 'red' }}
						d="M2187 2582.7H2259V2646.2H2187z"
						title="Адаптер подшипника R4"
						id="truck2BearingAdapterR4"
					></path>
					{/*рама боковаяL*/}
					<path
						fill="#E6E6E6"
						d="M729 2105.7H873V2582.7H729z"
						title="Рама боковая"
						id="truck2SideframeL"
					></path>
					<path
						style={{ fill: this.state.truck2SideframeInL2 ? '#DEEAD4' : 'red' }}
						d="M765 2195.7H837V2231.7H765z"
						title="Рама боковая L2"
						id="truck2SideframeInL2"
					></path>
					{/*скоба*/}
					<path
						style={{ fill: this.state.truck2SideframeStapleL4 ? '#DEEAD4' : 'red' }}
						d="M765 2447.7H837V2483.7H765z"
						title="Скоба L4"
						id="truck2SideframeStapleL4"
					></path>
					<path
						style={{ fill: this.state.truck2SideframeStapleL4 ? '#DEEAD4' : 'red' }}
						d="M765 2231.7H837V2303.7H765z"
						title="Скоба L3"
						id="truck2SideframeStapleL3"
					></path>
					{/*Планка фрикционная*/}
					<path
						style={{ fill: this.state.truck2SideframeFrictionStripL3 ? '#DEEAD4' : 'red' }}
						d="M765 2303.7H837V2375.7H765z"
						title="Планка фрикционная L3"
						id="truck2SideframeFrictionStripL3"
					></path>
					<path
						style={{ fill: this.state.truck2SideframeFrictionStripL4 ? '#DEEAD4' : 'red' }}
						d="M765 2375.7H837V2447.7H765z"
						title="Планка фрикционная L4"
						id="truck2SideframeFrictionStripL4"
					></path>
					{/*Балка надресорная, элементы верхнего сегмента*/}
					<g fill="#DEEAD4">
						{/*Пластина в клин. карм.l5*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamPlastl5 ? '#DEEAD4' : 'red' }}
							d="M1188 2231.7H1269V2303.7H1188z"
							title="Пластина в клин. карм.L5"
							id="truck2NadressornybeamPlastl5"
						></path>
						{/*Вставка в клин. карм.l3*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamInsertl5 ? '#DEEAD4' : 'red' }}
							d="M1269 2231.7H1350V2303.7H1269z"
							title="Вставка в клин. карм.L3"
							id="truck2NadressornybeamInsertl5"
						></path>
						{/*Пластина в клин. карм.l6*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamPlastl6 ? '#DEEAD4' : 'red' }}
							d="M1350 2231.7H1431V2303.7H1350z"
							title="Пластина в клин. карм.l6"
							id="truck2NadressornybeamPlastl6"
						></path>
						{/*"Кольцо в подпятник"*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamRing ? '#DEEAD4' : 'red' }}
							d="M1431 2231.7H1593V2303.7H1431z"
							title="Кольцо в подпятник 2"
							id="truck2NadressornybeamRing"
						></path>
						{/*"Пластина в клин. карм.r6"*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamPlastR6 ? '#DEEAD4' : 'red' }}
							d="M1593 2231.7H1674V2303.7H1593z"
							title="Пластина в клин. карм.r6"
							id="truck2NadressornybeamPlastR6"
						></path>
						{/*Вставка в клин. карм.r3*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamInsertR3 ? '#DEEAD4' : 'red' }}
							d="M1674 2231.7H1755V2303.7H1674z"
							title="Вставка в клин. карм.R3"
							id="truck2NadressornybeamInsertR3"
						></path>
						{/*Пластина в клин. карм.r5*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamPlastR5 ? '#DEEAD4' : 'red' }}
							d="M1755 2231.7H1836V2303.7H1755z"
							title="Пластина в клин. карм.r5"
							id="truck2NadressornybeamPlastR5"
						></path>
					</g>
					{/*Балка надресорная, элементы нижнего сегмента*/}
					<g fill="#DEEAD4">
						{/*Пластина в клин. карм.l7*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamBotoomPlastL7 ? '#DEEAD4' : 'red' }}
							d="M1188 2384.7H1269V2456.7H1188z"
							title="Пластина в клин. карм.l7"
							id="truck2NadressornybeamBotoomPlastL7"
						></path>
						{/*Вставка в клин. карм.l4*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamBotoomInsertL4 ? '#DEEAD4' : 'red' }}
							d="M1269 2384.7H1350V2456.7H1269z"
							title="Вставка в клин. карм.L4"
							id="truck2NadressornybeamBotoomInsertL4"
						></path>
						{/*Пластина в клин. карм.l8*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamBotoomPlastL8 ? '#DEEAD4' : 'red' }}
							d="M1350 2384.7H1431V2456.7H1350z"
							title="Пластина в клин. карм.l8"
							id="truck2NadressornybeamBotoomPlastL8"
						></path>
						{/*"Пластина в клин. карм.r8"*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamBotoomPlastR8 ? '#DEEAD4' : 'red' }}
							d="M1593 2384.7H1674V2456.7H1593z"
							title="Пластина в клин. карм.R8"
							id="truck2NadressornybeamBotoomPlastR8"
						></path>
						{/*Вставка в клин. карм.r4*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamBotoomInsertR4 ? '#DEEAD4' : 'red' }}
							d="M1674 2384.7H1755V2456.7H1674z"
							title="Вставка в клин. карм.R4"
							id="truck2NadressornybeamBotoomInsertR4"
						></path>
						{/*Пластина в клин. карм.r7*/}
						<path
							style={{ fill: this.state.truck2NadressornybeamBotoomPlastR7 ? '#DEEAD4' : 'red' }}
							d="M1755 2384.7H1836V2456.7H1755z"
							title="Пластина в клин. карм.R7"
							id="truck2NadressornybeamBotoomPlastR7"
						></path>
					</g>
					{/*Скользун левый : элементы*/}
					<g fill="#DEEAD4">
						{/*Колпак скользуна*/}
						<path
							style={{ fill: this.state.truck2SliderLHead ? '#DEEAD4' : 'red' }}
							d="M963 2231.7H1035V2303.7H963z"
							title="Колпак скользуна"
							id="truck2SliderLHead"
						></path>
						{/*Скольз. пр. внутр.Скольз. пр. наруж.*/}
						<path
							style={{ fill: this.state.truck2SliderLInside ? '#DEEAD4' : 'red' }}
							d="M963 2303.7H1035V2375.7H963z"
							title="Скольз. пр. внутр.Скольз. пр. наруж."
							id="truck2SliderLInside"
						></path>
						{/*Корпус скользуна*/}
						<path
							style={{ fill: this.state.truck2SliderLBody ? '#DEEAD4' : 'red' }}
							d="M963 2375.7H1035V2447.7H963z"
							title="Корпус скользуна"
							id="truck2SliderLBody"
						></path>
					</g>
					{/*Скользун левый : элементы-2ряд*/}
					<g fill="#DEEAD4">
						{/*Колпак скользуна*/}
						<path
							d="M1998 2240.7H2070V2312.7H1998z"
							style={{ fill: this.state.truck2SliderL2Head ? '#DEEAD4' : 'red' }}
							title="Колпак скользуна"
							id="truck2SliderL2Head"
						></path>
						{/*Скольз. пр. внутр.Скольз. пр. наруж.*/}
						<path
							style={{ fill: this.state.truck2SliderL2Inside ? '#DEEAD4' : 'red' }}
							d="M1998 2312.7H2070V2384.7H1998z"
							title="Скольз. пр. внутр.Скольз. пр. наруж."
							id="truck2SliderL2Inside"
						></path>
						{/*Корпус скользуна*/}
						<path
							style={{ fill: this.state.truck2SliderL2Body ? '#DEEAD4' : 'red' }}
							d="M1998 2384.7H2070V2456.7H1998z"
							title="Корпус скользуна"
							id="truck2SliderL2Body"
						></path>
					</g>
					{/*Клин L6*/}
					<path
						style={{ fill: this.state.truck2WedgeL6 ? '#DEEAD4' : 'red' }}
						d="M657 2195.7H729V2231.7H657z"
						title="Клин L6"
						id="truck2WedgeL6"
					></path>
					{/*Клин L8 to do*/}
					<path
						style={{ fill: this.state.truck2WedgeL8 ? '#DEEAD4' : 'red' }}
						d="M657 2447.7H729V2483.7H657z"
						title="Клин L8"
						id="truck2WedgeL8"
					></path>
					{/*"Пружина внутр.Пружина наруж.L12"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL12 ? '#DEEAD4' : 'red' }}
						d="M657 2231.7H729V2303.7H657z"
						title="Пружина внутр.Пружина наруж.L12"
						id="truck2InsideSpringL12"
					></path>
					{/*"Пружина внутр.Пружина наруж. L15"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL15 ? '#DEEAD4' : 'red' }}
						d="M657 2303.7H729V2375.7H657z"
						title="Пружина внутр.Пружина наруж.L15"
						id="truck2InsideSpringL15"
					></path>
					{/*"Пружина внутр.Пружина наруж. L18"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL18 ? '#DEEAD4' : 'red' }}
						d="M657 2375.7H729V2447.7H657z"
						title="Пружина внутр.Пружина наруж.L18"
						id="truck2InsideSpringL18"
					></path>
					{/*Клин L5*/}
					<path
						style={{ fill: this.state.truck2WedgeL5 ? '#DEEAD4' : 'red' }}
						d="M585 2195.7H657V2231.7H585z"
						title="Клин L5"
						id="truck2WedgeL5"
					></path>
					{/*Клин L7*/}
					<path
						style={{ fill: this.state.truck2WedgeL7 ? '#DEEAD4' : 'red' }}
						d="M585 2447.7H657V2483.7H585z"
						title="Клин L7"
						id="truck2WedgeL7"
					></path>
					{/*"Пружина внутр.Пружина наруж. L11"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL11 ? '#DEEAD4' : 'red' }}
						d="M585 2231.7H657V2303.7H585z"
						title="Пружина внутр.Пружина наруж.L11"
						id="truck2InsideSpringL11"
					></path>
					{/*"Пружина внутр.Пружина наруж. L14"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL14 ? '#DEEAD4' : 'red' }}
						d="M585 2303.7H657V2375.7H585z"
						title="Пружина внутр.Пружина наруж.L14"
						id="truck2InsideSpringL14"
					></path>
					{/*"Пружина внутр.Пружина наруж. L17"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL17 ? '#DEEAD4' : 'red' }}
						d="M585 2375.7H657V2447.7H585z"
						title="Пружина внутр.Пружина наруж.L17"
						id="truck2InsideSpringL17"
					></path>
					{/*"Пружина внутр.Пружина наруж. L10"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL10 ? '#DEEAD4' : 'red' }}
						d="M513 2231.7H585V2303.7H513z"
						title="Пружина внутр.Пружина наруж.L10"
						id="truck2InsideSpringL10"
					></path>
					{/*"Пружина внутр.Пружина наруж. L13"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL13 ? '#DEEAD4' : 'red' }}
						d="M513 2303.7H585V2375.7H513z"
						title="Пружина внутр.Пружина наруж.L13"
						id="truck2InsideSpringL13"
					></path>
					{/*"Пружина внутр.Пружина наруж. L16"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringL16 ? '#DEEAD4' : 'red' }}
						d="M513 2375.7H585V2447.7H513z"
						title="Пружина внутр.Пружина наруж.L16"
						id="truck2InsideSpringL16"
					></path>
					{/*Рама боковая правая R*/}
					<path
						fill="#E6E6E6"
						d="M2151 2105.7H2295V2582.7H2151z"
						transform="rotate(-180 2223 2344.167)"
						title="Рама боковая"
						id="truck2SideframeR"
					></path>
					{/*Рама боковая правая: элементы*/}
					{/*рама боковаяR2*/}
					<path
						style={{ fill: this.state.truck2SideframeR2 ? '#DEEAD4' : 'red' }}
						d="M2187 2195.7H2259V2231.7H2187z"
						transform="rotate(-180 2223 2213.667)"
						title="Рама боковая"
						id="truck2SideframeR2"
					></path>
					{/*скоба R3*/}
					<path
						style={{ fill: this.state.truck2SideframeStapleR3 ? '#DEEAD4' : 'red' }}
						d="M2187 2447.7H2259V2483.7H2187z"
						transform="rotate(-180 2223 2465.667)"
						title="Скоба R3"
						id="truck2SideframeStapleR3"
					></path>
					<path
						style={{ fill: this.state.truck2SideframeStapleR4 ? '#DEEAD4' : 'red' }}
						d="M2187 2231.7H2259V2303.7H2187z"
						transform="rotate(-180 2223 2267.667)"
						title="Скоба R4"
						id="truck2SideframeStapleR4"
					></path>
					{/*Планка фрикционная R3*/}
					<path
						style={{ fill: this.state.truck2SideframeFrictionStripR3 ? '#DEEAD4' : 'red' }}
						d="M2187 2303.7H2259V2375.7H2187z"
						transform="rotate(-180 2223 2339.667)"
						title="Планка фрикционная R3"
						id="truck2SideframeFrictionStripR3"
					></path>
					{/*Планка фрикционная R4*/}
					<path
						style={{ fill: this.state.truck2SideframeFrictionStripR4 ? '#DEEAD4' : 'red' }}
						d="M2187 2375.7H2259V2447.7H2187z"
						transform="rotate(-180 2223 2411.667)"
						title="Планка фрикционная R4"
						id="truck2SideframeFrictionStripR4"
					></path>
					{/*Клин R6*/}
					<path
						style={{ fill: this.state.truck2WedgeR6 ? '#DEEAD4' : 'red' }}
						d="M2295 2195.7H2367V2231.7H2295z"
						transform="rotate(-180 2331 2213.667)"
						title="Клин R6"
						id="truck2WedgeR6"
					></path>
					{/*Клин R8*/}
					<path
						style={{ fill: this.state.truck2WedgeR8 ? '#DEEAD4' : 'red' }}
						d="M2295 2447.7H2367V2483.7H2295z"
						transform="rotate(-180 2331 2465.667)"
						title="Клин R8"
						id="truck2WedgeR8"
					></path>
					{/*"Пружина внутр.Пружина наруж.R12"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR12 ? '#DEEAD4' : 'red' }}
						d="M2295 2231.7H2367V2303.7H2295z"
						transform="rotate(-180 2331 2267.667)"
						title="Пружина внутр.Пружина наруж.R12"
						id="truck2InsideSpringR12"
					></path>
					{/*"Пружина внутр.Пружина наруж.R15"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR15 ? '#DEEAD4' : 'red' }}
						d="M2295 2303.7H2367V2375.7H2295z"
						transform="rotate(-180 2331 2339.667)"
						title="Пружина внутр.Пружина наруж.R15"
						id="truck2InsideSpringR15"
					></path>
					{/*"Пружина внутр.Пружина наруж.R18"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR18 ? '#DEEAD4' : 'red' }}
						d="M2295 2375.7H2367V2447.7H2295z"
						transform="rotate(-180 2331 2411.667)"
						title="Пружина внутр.Пружина наруж.R18"
						id="truck2InsideSpringR18"
					></path>
					{/*Клин R5*/}
					<path
						style={{ fill: this.state.truck2Wedger5 ? '#DEEAD4' : 'red' }}
						d="M2367 2195.7H2439V2231.7H2367z"
						transform="rotate(-180 2403 2213.667)"
						title="Клин R5"
						id="truck2Wedger5"
					></path>
					{/*Клин R7*/}
					<path
						style={{ fill: this.state.truck2Wedger7 ? '#DEEAD4' : 'red' }}
						d="M2367 2447.7H2439V2483.7H2367z"
						transform="rotate(-180 2403 2465.667)"
						title="Клин R7"
						id="truck2Wedger7"
					></path>
					{/*"Пружина внутр.Пружина наруж. R11"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR11 ? '#DEEAD4' : 'red' }}
						d="M2367 2231.7H2439V2303.7H2367z"
						transform="rotate(-180 2403 2267.667)"
						title="Пружина внутр.Пружина наруж.R11"
						id="truck2InsideSpringR11"
					></path>
					{/*"Пружина внутр.Пружина наруж. R14"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR14 ? '#DEEAD4' : 'red' }}
						d="M2367 2303.7H2439V2375.7H2367z"
						transform="rotate(-180 2403 2339.667)"
						title="Пружина внутр.Пружина наруж.R14"
						id="truck2InsideSpringR14"
					></path>
					{/*"Пружина внутр.Пружина наруж. R17"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR17 ? '#DEEAD4' : 'red' }}
						d="M2367 2375.7H2439V2447.7H2367z"
						transform="rotate(-180 2403 2411.667)"
						title="Пружина внутр.Пружина наруж.R17"
						id="truck2InsideSpringR17"
					></path>
					{/*"Пружина внутр.Пружина наруж. R10"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR10 ? '#DEEAD4' : 'red' }}
						d="M2439 2231.7H2511V2303.7H2439z"
						transform="rotate(-180 2475 2267.667)"
						title="Пружина внутр.Пружина наруж.R10"
						id="truck2InsideSpringR10"
					></path>
					{/*"Пружина внутр.Пружина наруж. R13"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR13 ? '#DEEAD4' : 'red' }}
						d="M2439 2303.7H2511V2375.7H2439z"
						transform="rotate(-180 2475 2339.667)"
						title="Пружина внутр.Пружина наруж.R13"
						id="truck2InsideSpringR13"
					></path>
					{/*"Пружина внутр.Пружина наруж. R16"*/}
					<path
						style={{ fill: this.state.truck2InsideSpringR16 ? '#DEEAD4' : 'red' }}
						d="M2439 2375.7H2511V2447.7H2439z"
						transform="rotate(-180 2475 2411.667)"
						title="Пружина внутр.Пружина наруж.R16"
						id="truck2InsideSpringR16"
					></path>
					{/*Триангель 3*/}
					<path
						fill="#E6E6E6"
						d="M1350 2114.7H1674V2159.7H1350z"
						title="Триангель 3"
						id="truck2Triangel3"
					></path>
					{/*Вкладыш подпятника 2*/}
					<path
						style={{ fill: this.state.truck2ThrustBearing2 ? '#DEEAD4' : 'red' }}
						d="M1350 2159.7H1674V2195.7H1350z"
						title="Вкладыш подпятника 2"
						id="truck2ThrustBearing2"
					></path>
					{/*Триангель 4*/}
					<path
						fill="#E6E6E6"
						d="M1350 2501.7H1674V2537.7H1350z"
						title="Триангель 4"
						id="truck2Triangel4"
					></path>
					{/*Балка надрессорная 2*/}
					<path
						style={{ fill: this.state.truck2Nadressornybeam2 ? '#DEEAD4' : 'red' }}
						d="M1188 2303.7H1836V2384.7H1188z"
						title="Балка надрессорная 2"
						id="truck2Nadressornybeam2"
					></path>
				</g>
			</g>
		);
	}
}