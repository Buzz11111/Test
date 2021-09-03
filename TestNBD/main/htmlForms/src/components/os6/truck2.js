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
			truck2SideframeInL: false,
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
				d="M387 1728H2619V2961H387z"
				title="Тележка 2"
				id="truck2"
			></path>
					{/*колесная пара 1*/ }
		<path
			fill="#F2F2F2"
			d="M423.5 1764.5H2582.5V2042.5H423.5z"
			title="Колесная пара 1"
			id="truck2Wheels1"
		></path>
			<path d="M2582 1765v277H424v-277h2158m1-1H423v279h2160v-279z"></path>
			<path
				fill="#E6E6E6"
				stroke="#000"
				strokeMiterlimit="10"
				d="M567 1791H2439V2016H567z"
				title="Колесная пара без буксовых узлов 1"
				id="truck2WheelsWhithoutStopNode"
			></path>
			<path
				style={{ fill: this.state.truck2WheelsWhithoutStopNodeAxis1 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M693 1854H2295V1889.5H693z"
				title="Ось чистовая"
				id="truck2WheelsWhithoutStopNodeAxis1"
			></path>
			<path
				style={{ fill: this.state.truck2WheelsWhithoutStopNodeAxis2 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M693 1889.5H2295V1926H693z"
				title="Ось чистовая"
				id="truck2WheelsWhithoutStopNodeAxis2"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels1Wheel1 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M639 1818H711V1926H639z"
				title="Колесо"
				id="truck2Wheels1Wheel1"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels1Wheel2 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M2295 1818H2367V1926H2295z"
				title="Колесо"
				id="truck2Wheels1Wheel2"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels1Bearing1 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M494.5 1854H567V1890H494.5z"
				title="Подшипник"
				id="truck2Wheels1Bearing1"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels1Bearing2 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M2439 1854H2512V1890H2439z"
				title="Подшипник"
				id="truck2Wheels1Bearing2"
			></path>
					{/*колесная пара 2*/ }
		<g>
			<path
				fill="#F2F2F2"
				d="M423.5 2646.5H2582.5V2924.5H423.5z"
				title="Колесная пара 2"
				id="truck2Wheels2"
			></path>
			<path d="M2582 2647v277H424v-277h2158m1-1H423v279h2160v-279z"></path>
			<path
				fill="#E6E6E6"
				stroke="#000"
				strokeMiterlimit="10"
				d="M567 2673H2439V2898H567z"
				title="Колесная пара без буксовых узлов 2"
				id="truck2Wheels2WhithoutStopNode"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels2WhithoutStopNodeAxis1 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M693 2736H2295V2771.5H693z"
				title="Ось чистовая"
				id="truck2Wheels2WhithoutStopNodeAxis1"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels2WhithoutStopNodeAxis2 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M693 2771.5H2295V2808H693z"
				title="Ось чистовая"
				id="truck2Wheels2WhithoutStopNodeAxis2"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels2Wheel1 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M639 2700H711V2808H639z"
				title="Колесо"
				id="truck2Wheels2Wheel1"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels2Wheel2 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M2295 2700H2367V2808H2295z"
				title="Колесо"
				id="truck2Wheels2Wheel2"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels2Bearing1 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M494.5 2736H567V2772H494.5z"
				title="Подшипник"
				id="truck2Wheels2Bearing1"
			></path>
			<path
				style={{ fill: this.state.truck2Wheels2Bearing2 ? '#DEEAD4' : 'red' }}
				stroke="#000"
				strokeMiterlimit="10"
				d="M2439 2736H2512V2772H2439z"
				title="Подшипник"
				id="truck2Wheels2Bearing2"
			></path>
		</g>
		{/*адапрет подшипника*/ }
		<g stroke="#000" strokeMiterlimit="10">
			<path
				style={{ fill: this.state.truck2BearingAdapterL3 ? '#DEEAD4' : 'red' }}
				d="M765 2042.5H837V2106H765z"
				title="Адаптер подшипника L3"
				id="truck2BearingAdapterL3"
			></path>
			<path
				style={{ fill: this.state.truck2BearingAdapterR3 ? '#DEEAD4' : 'red' }}
				d="M2187 2042.5H2259V2106H2187z"
				transform="rotate(-180 2223 2074.25)"
				title="Адаптер подшипника R3"
				id="truck2BearingAdapterR3"
			></path>
			{/*Балка надрессорная*/}
			<path
				fill="#E6E6E6"
				d="M1125 2196H1917V2502H1125z"
				title="Балка надрессорная"
				id="truck2Nadressornybeam"
			></path>
			{/*Скользун l*/}
			<path
				fill="#E6E6E6"
				d="M873 2196H945V2502H873z"
				title="Скользун L3"
				id="truck2SliderL3"
			></path>
			{/*Скользун r*/}
			<path
				fill="#E6E6E6"
				d="M2079 2196H2151V2502H2079z"
				title="Скользун R2"
				id="truck2SliderR2"
			></path>
			{/*адапрет подшипника*/}
			<path
				style={{ fill: this.state.truck2BearingAdapterL4 ? '#DEEAD4' : 'red' }}
				d="M765 2583H837V2646.5H765z"
				title="Адаптер подшипника L4"
				id="truck2BearingAdapterL4"
			></path>
			<path
				style={{ fill: this.state.truck2BearingAdapterR4 ? '#DEEAD4' : 'red' }}
				d="M2187 2583H2259V2646.5H2187z"
				title="Адаптер подшипника R4"
				id="truck2BearingAdapterR4"
			></path>
			{/*рама боковаяL*/}
			<path
				fill="#E6E6E6"
				d="M729 2106H873V2583H729z"
				title="Рама боковая"
				id="truck2SideframeL"
			></path>
			<path
				style={{ fill: this.state.truck2SideframeInL ? '#DEEAD4' : 'red' }}
				d="M765 2196H837V2232H765z"
				title="Рама боковая L1"
				id="truck2SideframeInL"
			></path>
			{/*скоба*/}
			<path
				style={{ fill: this.state.truck2SideframeStapleL3 ? '#DEEAD4' : 'red' }}
				d="M765 2448H837V2484H765z"
				title="Скоба L3"
				id="truck2SideframeStapleL3"
			></path>
			<path
				style={{ fill: this.state.truck2SideframeStapleL4 ? '#DEEAD4' : 'red' }}
				d="M765 2232H837V2304H765z"
				title="Скоба L4"
				id="truck2SideframeStapleL4"
			></path>
			{/*Планка фрикционная*/}
			<path
				style={{ fill: this.state.truck2SideframeFrictionStripL3 ? '#DEEAD4' : 'red' }}
				d="M765 2304H837V2376H765z"
				title="Планка фрикционная L3"
				id="truck2SideframeFrictionStripL3"
			></path>
			<path
				style={{ fill: this.state.truck2SideframeFrictionStripL4 ? '#DEEAD4' : 'red' }}
				d="M765 2376H837V2448H765z"
				title="Планка фрикционная L4"
				id="truck2SideframeFrictionStripL4"
			></path>
			{/*Балка надресорная, элементы верхнего сегмента*/}
			<g fill="#DEEAD4">
				{/*Пластина в клин. карм.l5*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamPlastl5 ? '#DEEAD4' : 'red' }}
					d="M1188 2232H1269V2304H1188z"
					title="Пластина в клин. карм.L5"
					id="truck2NadressornybeamPlastl5"
				></path>
				{/*Вставка в клин. карм.l3*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamInsertl5 ? '#DEEAD4' : 'red' }}
					d="M1269 2232H1350V2304H1269z"
					title="Вставка в клин. карм.L3"
					id="truck2NadressornybeamInsertl5"
				></path>
				{/*Пластина в клин. карм.l6*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamPlastl6 ? '#DEEAD4' : 'red' }}
					d="M1350 2232H1431V2304H1350z"
					title="Пластина в клин. карм.l6"
					id="truck2NadressornybeamPlastl6"
				></path>
				{/*"Кольцо в подпятник"*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamRing ? '#DEEAD4' : 'red' }}
					d="M1431 2232H1593V2304H1431z"
					title="Кольцо в подпятник 2"
					id="truck2NadressornybeamRing"
				></path>
				{/*"Пластина в клин. карм.r6"*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamPlastR6 ? '#DEEAD4' : 'red' }}
					d="M1593 2232H1674V2304H1593z"
					title="Пластина в клин. карм.r6"
					id="truck2NadressornybeamPlastR6"
				></path>
				{/*Вставка в клин. карм.r3*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamInsertR3 ? '#DEEAD4' : 'red' }}
					d="M1674 2232H1755V2304H1674z"
					title="Вставка в клин. карм.R3"
					id="truck2NadressornybeamInsertR3"
				></path>
				{/*Пластина в клин. карм.r5*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamPlastR5 ? '#DEEAD4' : 'red' }}
					d="M1755 2232H1836V2304H1755z"
					title="Пластина в клин. карм.r5"
					id="truck2NadressornybeamPlastR5"
				></path>
			</g>
			{/*Балка надресорная, элементы нижнего сегмента*/}
			<g fill="#DEEAD4">
				{/*Пластина в клин. карм.l7*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamBotoomPlastL7 ? '#DEEAD4' : 'red' }}
					d="M1188 2385H1269V2457H1188z"
					title="Пластина в клин. карм.l7"
					id="truck2NadressornybeamBotoomPlastL7"
				></path>
				{/*Вставка в клин. карм.l4*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamBotoomInsertL4 ? '#DEEAD4' : 'red' }}
					d="M1269 2385H1350V2457H1269z"
					title="Вставка в клин. карм.L4"
					id="truck2NadressornybeamBotoomInsertL4"
				></path>
				{/*Пластина в клин. карм.l8*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamBotoomPlastL8 ? '#DEEAD4' : 'red' }}
					d="M1350 2385H1431V2457H1350z"
					title="Пластина в клин. карм.l8"
					id="truck2NadressornybeamBotoomPlastL8"
				></path>
				{/*"Пластина в клин. карм.r8"*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamBotoomPlastR8 ? '#DEEAD4' : 'red' }}
					d="M1593 2385H1674V2457H1593z"
					title="Пластина в клин. карм.R8"
					id="truck2NadressornybeamBotoomPlastR8"
				></path>
				{/*Вставка в клин. карм.r4*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamBotoomInsertR4 ? '#DEEAD4' : 'red' }}
					d="M1674 2385H1755V2457H1674z"
					title="Вставка в клин. карм.R4"
					id="truck2NadressornybeamBotoomInsertR4"
				></path>
				{/*Пластина в клин. карм.r7*/}
				<path
					style={{ fill: this.state.truck2NadressornybeamBotoomPlastR7 ? '#DEEAD4' : 'red' }}
					d="M1755 2385H1836V2457H1755z"
					title="Пластина в клин. карм.R7"
					id="truck2NadressornybeamBotoomPlastR7"
				></path>
			</g>
			{/*Скользун левый : элементы*/}
			<g fill="#DEEAD4">
				{/*Колпак скользуна*/}
				<path
					style={{ fill: this.state.truck2SliderLHead ? '#DEEAD4' : 'red' }}
					d="M873 2232H945V2304H873z"
					title="Колпак скользуна"
					id="truck2SliderLHead"
				></path>
				{/*Скольз. пр. внутр.Скольз. пр. наруж.*/}
				<path
					style={{ fill: this.state.truck2SliderLInside ? '#DEEAD4' : 'red' }}
					d="M873 2304H945V2376H873z"
					title="Скольз. пр. внутр.Скольз. пр. наруж."
					id="truck2SliderLInside"
				></path>
				{/*Корпус скользуна*/}
				<path
					style={{ fill: this.state.truck2SliderLBody ? '#DEEAD4' : 'red' }}
					d="M873 2376H945V2448H873z"
					title="Корпус скользуна"
					id="truck2SliderLBody"
				></path>
			</g>
			{/*Скользун левый : элементы-2ряд*/}
					<path fill="#E6E6E6" d="M1053 2196H1125V2502H1053z" title="Скользун R3"></path>
			<g fill="#DEEAD4">
				{/*Колпак скользуна*/}
				<path
					style={{ fill: this.state.truck2SliderL2Head ? '#DEEAD4' : 'red' }}
					d="M1053 2232H1125V2304H1053z"
					title="Колпак скользуна"
					id="truck2SliderL2Head"
				></path>
				{/*Скольз. пр. внутр.Скольз. пр. наруж.*/}
				<path
					style={{ fill: this.state.truck2SliderL2Inside ? '#DEEAD4' : 'red' }}
					d="M1053 2304H1125V2376H1053z"
					title="Скольз. пр. внутр.Скольз. пр. наруж."
					id="truck2SliderL2Inside"
				></path>
				{/*Корпус скользуна*/}
				<path
					style={{ fill: this.state.truck2SliderL2Body ? '#DEEAD4' : 'red' }}
					d="M1053 2376H1125V2448H1053z"
					title="Корпус скользуна"
					id="truck2SliderL2Body"
				></path>
			</g>
			{/*Скользун правый : элементы-2ряд*/}
			<g fill="#DEEAD4">
				{/*Колпак скользуна*/}
				<path
					style={{ fill: this.state.truck2SliderR2Head ? '#DEEAD4' : 'red' }}
					d="M2079 2241H2151V2313H2079z"
					title="Колпак скользуна"
					id="truck2SliderR2Head"
				></path>
				{/*Скольз. пр. внутр.Скольз. пр. наруж.*/}
				<path
					style={{ fill: this.state.truck2SliderR2Inside ? '#DEEAD4' : 'red' }}
					d="M2079 2313H2151V2385H2079z"
					title="Скольз. пр. внутр.Скольз. пр. наруж."
					id="truck2SliderR2Inside"
				></path>
				{/*Корпус скользуна*/}
				<path
					style={{ fill: this.state.truck2SliderR2Body ? '#DEEAD4' : 'red' }}
					d="M2079 2385H2151V2457H2079z"
					title="Корпус скользуна"
					id="truck2SliderR2Body"
				></path>
			</g>
			{/*Скользун правый : элементы*/}
			<path fill="#E6E6E6" d="M1917 2196H1989V2502H1917z" title="Скользун R3"></path>
			<g fill="#DEEAD4">
				{/*Колпак скользуна*/}
				<path
					style={{ fill: this.state.truck2SliderRHead ? '#DEEAD4' : 'red' }}
					d="M1917 2241H1989V2313H1917z"
					title="Колпак скользуна"
					id="truck2SliderRHead"
				></path>
				{/*Скольз. пр. внутр.Скольз. пр. наруж.*/}
				<path
					style={{ fill: this.state.truck2SliderRInside ? '#DEEAD4' : 'red' }}
					d="M1917 2313H1989V2385H1917z"
					title="Скольз. пр. внутр.Скольз. пр. наруж."
					id="truck2SliderRInside"
				></path>
				{/*Корпус скользуна*/}
				<path
					style={{ fill: this.state.truck2SliderRBody ? '#DEEAD4' : 'red' }}
					d="M1917 2385H1989V2457H1917z"
					title="Корпус скользуна"
					id="truck2SliderRBody"
				></path>
			</g>
			{/*Клин L6*/}
			<path
				style={{ fill: this.state.truck2WedgeL6 ? '#DEEAD4' : 'red' }}
				d="M657 2196H729V2232H657z"
				title="Клин L6"
				id="truck2WedgeL6"
			></path>
			{/*Клин L8 to do*/}
			<path
				style={{ fill: this.state.truck2WedgeL8 ? '#DEEAD4' : 'red' }}
				d="M657 2448H729V2484H657z"
				title="Клин L8"
				id="truck2WedgeL8"
			></path>
			{/*"Пружина внутр.Пружина наруж.L12"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL12 ? '#DEEAD4' : 'red' }}
				d="M657 2232H729V2304H657z"
				title="Пружина внутр.Пружина наруж.L12"
				id="truck2InsideSpringL12"
			></path>
			{/*"Пружина внутр.Пружина наруж. L15"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL15 ? '#DEEAD4' : 'red' }}
				d="M657 2304H729V2376H657z"
				title="Пружина внутр.Пружина наруж.L15"
				id="truck2InsideSpringL15"
			></path>
			{/*"Пружина внутр.Пружина наруж. L18"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL18 ? '#DEEAD4' : 'red' }}
				d="M657 2376H729V2448H657z"
				title="Пружина внутр.Пружина наруж.L18"
				id="truck2InsideSpringL18"
			></path>
			{/*Клин L5*/}
			<path
				style={{ fill: this.state.truck2WedgeL5 ? '#DEEAD4' : 'red' }}
				d="M585 2196H657V2232H585z"
				title="Клин L5"
				id="truck2WedgeL5"
			></path>
			{/*Клин L7*/}
			<path
				style={{ fill: this.state.truck2WedgeL7 ? '#DEEAD4' : 'red' }}
				d="M585 2448H657V2484H585z"
				title="Клин L7"
				id="truck2WedgeL7"
			></path>
			{/*"Пружина внутр.Пружина наруж. L11"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL11 ? '#DEEAD4' : 'red' }}
				d="M585 2232H657V2304H585z"
				title="Пружина внутр.Пружина наруж.L11"
				id="truck2InsideSpringL11"
			></path>
			{/*"Пружина внутр.Пружина наруж. L14"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL14 ? '#DEEAD4' : 'red' }}
				d="M585 2304H657V2376H585z"
				title="Пружина внутр.Пружина наруж.L14"
				id="truck2InsideSpringL14"
			></path>
			{/*"Пружина внутр.Пружина наруж. L17"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL17 ? '#DEEAD4' : 'red' }}
				d="M585 2376H657V2448H585z"
				title="Пружина внутр.Пружина наруж.L17"
				id="truck2InsideSpringL17"
			></path>
			{/*"Пружина внутр.Пружина наруж. L10"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL10 ? '#DEEAD4' : 'red' }}
				d="M513 2232H585V2304H513z"
				title="Пружина внутр.Пружина наруж.L10"
				id="truck2InsideSpringL10"
			></path>
			{/*"Пружина внутр.Пружина наруж. L13"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL13 ? '#DEEAD4' : 'red' }}
				d="M513 2304H585V2376H513z"
				title="Пружина внутр.Пружина наруж.L13"
				id="truck2InsideSpringL13"
			></path>
			{/*"Пружина внутр.Пружина наруж. L16"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringL16 ? '#DEEAD4' : 'red' }}
				d="M513 2376H585V2448H513z"
				title="Пружина внутр.Пружина наруж.L16"
				id="truck2InsideSpringL16"
			></path>
			{/*Рама боковая правая R*/}
			<path
				fill="#E6E6E6"
				d="M2151 2106H2295V2583H2151z"
				transform="rotate(-180 2223 2344.5)"
				title="Рама боковая"
				id="truck2SideframeR"
			></path>
			{/*Рама боковая правая: элементы*/}
			{/*рама боковаяR2*/}
			<path
				style={{ fill: this.state.truck2SideframeR2 ? '#DEEAD4' : 'red' }}
				d="M2187 2196H2259V2232H2187z"
				transform="rotate(-180 2223 2214)"
				title="Рама боковая"
				id="truck2SideframeR2"
			></path>
			{/*скоба R3*/}
			<path
				style={{ fill: this.state.truck2SideframeStapleR3 ? '#DEEAD4' : 'red' }}
				d="M2187 2448H2259V2484H2187z"
				transform="rotate(-180 2223 2466)"
				title="Скоба R3"
				id="truck2SideframeStapleR3"
			></path>
			<path
				style={{ fill: this.state.truck2SideframeStapleR4 ? '#DEEAD4' : 'red' }}
				d="M2187 2232H2259V2304H2187z"
				transform="rotate(-180 2223 2268)"
				title="Скоба R4"
				id="truck2SideframeStapleR4"
			></path>
			{/*Планка фрикционная R3*/}
			<path
				style={{ fill: this.state.truck2SideframeFrictionStripR3 ? '#DEEAD4' : 'red' }}
				d="M2187 2304H2259V2376H2187z"
				transform="rotate(-180 2223 2340)"
				title="Планка фрикционная R3"
				id="truck2SideframeFrictionStripR3"
			></path>
			{/*Планка фрикционная R4*/}
			<path
				style={{ fill: this.state.truck2SideframeFrictionStripR4 ? '#DEEAD4' : 'red' }}
				d="M2187 2376H2259V2448H2187z"
				transform="rotate(-180 2223 2412)"
				title="Планка фрикционная R4"
				id="truck2SideframeFrictionStripR4"
			></path>
			{/*Клин R6*/}
			<path
				style={{ fill: this.state.truck2WedgeR6 ? '#DEEAD4' : 'red' }}
				d="M2295 2196H2367V2232H2295z"
				transform="rotate(-180 2331 2214)"
				title="Клин R6"
				id="truck2WedgeR6"
			></path>
			{/*Клин R8*/}
			<path
				style={{ fill: this.state.truck2WedgeR8 ? '#DEEAD4' : 'red' }}
				d="M2295 2448H2367V2484H2295z"
				transform="rotate(-180 2331 2466)"
				title="Клин R8"
				id="truck2WedgeR8"
			></path>
			{/*"Пружина внутр.Пружина наруж.R12"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR12 ? '#DEEAD4' : 'red' }}
				d="M2295 2232H2367V2304H2295z"
				transform="rotate(-180 2331 2268)"
				title="Пружина внутр.Пружина наруж.R12"
				id="truck2InsideSpringR12"
			></path>
			{/*"Пружина внутр.Пружина наруж.R15"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR15 ? '#DEEAD4' : 'red' }}
				d="M2295 2304H2367V2376H2295z"
				transform="rotate(-180 2331 2340)"
				title="Пружина внутр.Пружина наруж.R15"
				id="truck2InsideSpringR15"
			></path>
			{/*"Пружина внутр.Пружина наруж.R18"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR18 ? '#DEEAD4' : 'red' }}
				d="M2295 2376H2367V2448H2295z"
				transform="rotate(-180 2331 2412)"
				title="Пружина внутр.Пружина наруж.R18"
				id="truck2InsideSpringR18"
			></path>
			{/*Клин R5*/}
			<path
				style={{ fill: this.state.truck2Wedger5 ? '#DEEAD4' : 'red' }}
				d="M2367 2196H2439V2232H2367z"
				transform="rotate(-180 2403 2214)"
				title="Клин R5"
				id="truck2Wedger5"
			></path>
			{/*Клин R7*/}
			<path
				style={{ fill: this.state.truck2Wedger7 ? '#DEEAD4' : 'red' }}
				d="M2367 2448H2439V2484H2367z"
				transform="rotate(-180 2403 2466)"
				title="Клин R7"
				id="truck2Wedger7"
			></path>
			{/*"Пружина внутр.Пружина наруж. R11"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR11 ? '#DEEAD4' : 'red' }}
				d="M2367 2232H2439V2304H2367z"
				transform="rotate(-180 2403 2268)"
				title="Пружина внутр.Пружина наруж.R11"
				id="truck2InsideSpringR11"
			></path>
			{/*"Пружина внутр.Пружина наруж. R14"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR14 ? '#DEEAD4' : 'red' }}
				d="M2367 2304H2439V2376H2367z"
				transform="rotate(-180 2403 2340)"
				title="Пружина внутр.Пружина наруж.R14"
				id="truck2InsideSpringR14"
			></path>
			{/*"Пружина внутр.Пружина наруж. R17"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR17 ? '#DEEAD4' : 'red' }}
				d="M2367 2376H2439V2448H2367z"
				transform="rotate(-180 2403 2412)"
				title="Пружина внутр.Пружина наруж.R17"
				id="truck2InsideSpringR17"
			></path>
			{/*"Пружина внутр.Пружина наруж. R10"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR10 ? '#DEEAD4' : 'red' }}
				d="M2439 2232H2511V2304H2439z"
				transform="rotate(-180 2475 2268)"
				title="Пружина внутр.Пружина наруж.R10"
				id="truck2InsideSpringR10"
			></path>
			{/*"Пружина внутр.Пружина наруж. R13"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR13 ? '#DEEAD4' : 'red' }}
				d="M2439 2304H2511V2376H2439z"
				transform="rotate(-180 2475 2340)"
				title="Пружина внутр.Пружина наруж.R13"
				id="truck2InsideSpringR13"
			></path>
			{/*"Пружина внутр.Пружина наруж. R16"*/}
			<path
				style={{ fill: this.state.truck2InsideSpringR16 ? '#DEEAD4' : 'red' }}
				d="M2439 2376H2511V2448H2439z"
				transform="rotate(-180 2475 2412)"
				title="Пружина внутр.Пружина наруж.R16"
				id="truck2InsideSpringR16"
			></path>
			{/*Триангель 3*/}
			<path
				fill="#E6E6E6"
				d="M1350 2115H1674V2160H1350z"
				title="Триангель 3"
				id="truck2Triangel3"
			></path>
			{/*Вкладыш подпятника 2*/}
			<path
				style={{ fill: this.state.truck2ThrustBearing2 ? '#DEEAD4' : 'red' }}
				d="M1350 2160H1674V2196H1350z"
				title="Вкладыш подпятника 2"
				id="truck2ThrustBearing2"
			></path>
			{/*Триангель 4*/}
			<path
				fill="#E6E6E6"
				d="M1350 2502H1674V2538H1350z"
				title="Триангель 4"
				id="truck2Triangel4"
			></path>
			{/*Балка надрессорная 2*/}
			<path
				style={{ fill: this.state.truck2Nadressornybeam2 ? '#DEEAD4' : 'red' }}
				d="M1188 2304H1836V2385H1188z"
				title="Балка надрессорная 2"
				id="truck2Nadressornybeam2"
			></path>
				</g>
			</g>
			);
	}
}