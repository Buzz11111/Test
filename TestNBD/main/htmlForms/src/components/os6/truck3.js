import React, { Component } from 'react';

export default class Truck3 extends Component {
	constructor(props) {
		super(props);

		this.state = {
			truck3WheelsWhithoutStopNodeAxis1: false,
			truck3WheelsWhithoutStopNodeAxis2: false,
			truck3Wheels1Wheel1: false,
			truck3Wheels1Wheel2: false,
			truck3Wheels1Bearing1: false,
			truck3Wheels1Bearing2: false,
			truck3Wheels2WhithoutStopNodeAxis1: false,
			truck3Wheels2WhithoutStopNodeAxis2: false,
			truck3Wheels2Wheel1: false,
			truck3Wheels2Wheel2: false,
			truck3Wheels2Bearing1: false,
			truck3Wheels2Bearing2: false,
			truck3BearingAdapterL5: false,
			truck3BearingAdapterR5: false,
			truck3BearingAdapterL6: false,
			truck3BearingAdapterR6: false,
			truck3SideframeInL3: false,
			truck3SideframeStapleL6: false,
			truck3SideframeStapleL5: false,
			truck3SideframeFrictionStripL5: false,
			truck3SideframeFrictionStripL6: false,
			truck3NadressornybeamPlastl9: false,
			truck3NadressornybeamInsertl5: false,
			truck3NadressornybeamPlastl10: false,
			truck3NadressornybeamRing: false,
			truck3NadressornybeamPlastR10: false,
			truck3NadressornybeamInsertR5: false,
			truck3NadressornybeamPlastR9: false,
			truck3NadressornybeamBotoomPlastL11: false,
			truck3NadressornybeamBotoomInsertL6: false,
			truck3NadressornybeamBotoomPlastL12: false,
			truck3NadressornybeamBotoomPlastR12: false,
			truck3NadressornybeamBotoomInsertR6: false,
			truck3NadressornybeamBotoomInsertR11: false,
			truck3SliderLHead: false,
			truck3SliderLInside: false,
			truck3SliderLBody: false,
			truck3SliderRHead: false,
			truck3SliderRInside: false,
			truck3SliderRBody: false,
			truck3WedgeL10: false,
			truck3WedgeL12: false,
			truck3InsideSpringL21: false,
			truck3InsideSpringL24: false,
			truck3InsideSpringL27: false,
			truck3WedgeL9: false,
			truck3WedgeL11: false,
			truck3InsideSpringL20: false,
			truck3InsideSpringL23: false,
			truck3InsideSpringL26: false,
			truck3InsideSpringL19: false,
			truck3InsideSpringL22: false,
			truck3InsideSpringL25: false,
			truck3SideframeInR3: false,
			truck3SideframeStapleR5: false,
			truck3SideframeStapleR6: false,
			truck3SideframeFrictionStripR5: false,
			truck3SideframeFrictionStripR6: false,
			truck3WedgeR10: false,
			truck3WedgeR12: false,
			truck3InsideSpringR21: false,
			truck3InsideSpringR24: false,
			truck3InsideSpringR27: false,
			truck3Wedger9: false,
			truck3Wedger11: false,
			truck3InsideSpringR20: false,
			truck3InsideSpringR23: false,
			truck3InsideSpringR26: false,
			truck3InsideSpringR19: false,
			truck3InsideSpringR22: false,
			truck3InsideSpringR25: false,
			truck3ThrustBearing3: false,
			truck3Nadressornybeam3: false,
		}

	}

	componentDidMount() {
		if (window.truck3Data) {
			this.setState(window.truck3Data);
		}
	}

	render() {
		return (
			<g>
				<path
					fill="#F2F2F2"
					stroke="#000"
					strokeMiterlimit="10"
					d="M387 3006H2619V4320H387z"
					title="Тележка 3"
					id="truck3"
				></path>

				<path
					fill="#F2F2F2"
					d="M423.5 3042.5H2582.5V3320.5H423.5z"
					title="Колесная пара 5"
					id="truck3Wheels5"
				></path>
				<path d="M2582 3043v277H424v-277h2158m1-1H423v279h2160v-279z"></path>
				<path
					fill="#E6E6E6"
					stroke="#000"
					strokeMiterlimit="10"
					d="M567 3069H2439V3294H567z"
					title="Колесная пара без буксовых узлов 1"
					id="truck3WheelsWhithoutStopNode"
				></path>
				<path
					style={{ fill: this.state.truck3WheelsWhithoutStopNodeAxis1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M693 3168H2295V3204H693z"
					title="Ось чистовая"
					id="truck3WheelsWhithoutStopNodeAxis1"
				></path>
				<path
					style={{ fill: this.state.truck3WheelsWhithoutStopNodeAxis2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M693 3204H2295V3240H693z"
					title="Ось чистовая"
					id="truck3WheelsWhithoutStopNodeAxis2"
				></path>
				<path
					style={{ fill: this.state.truck3Wheels1Wheel1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M639 3096H711V3240H639z"
					title="Колесо"
					id="truck3Wheels1Wheel1"
				></path>
				<path
					style={{ fill: this.state.truck3Wheels1Wheel2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M2295 3096H2367V3240H2295z"
					title="Колесо"
					id="truck3Wheels1Wheel2"
				></path>
				<path
					style={{ fill: this.state.truck3Wheels1Bearing1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M495 3168H567V3204H495z"
					title="Подшипник"
					id="truck3Wheels1Bearing1"
				></path>
				<path
					style={{ fill: this.state.truck3Wheels1Bearing2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M2439 3168H2512V3204H2439z"
					title="Подшипник"
					id="truck3Wheels1Bearing2"
				></path>
				{/*колесная пара 2*/}
				<g>
					<path
						fill="#F2F2F2"
						d="M423.5 3951.5H2582.5V4229.5H423.5z"
						title="Колесная пара 2"
						id="truck3Wheels2"
					></path>
					<path d="M2582 3952v277H424v-277h2158m1-1H423v279h2160v-279z"></path>
					<path
						fill="#E6E6E6"
						stroke="#000"
						strokeMiterlimit="10"
						d="M567 3978H2439V4203H567z"
						title="Колесная пара без буксовых узлов 2"
						id="truck3Wheels2WhithoutStopNode"
					></path>
					<path
						style={{ fill: this.state.truck3Wheels2WhithoutStopNodeAxis1 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M693 4041H2295V4076.5H693z"
						title="Ось чистовая"
						id="truck3Wheels2WhithoutStopNodeAxis1"
					></path>
					<path
						style={{ fill: this.state.truck3Wheels2WhithoutStopNodeAxis2 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M693 4076.5H2295V4113H693z"
						title="Ось чистовая"
						id="truck3Wheels2WhithoutStopNodeAxis2"
					></path>
					<path
						style={{ fill: this.state.truck3Wheels2Wheel1 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M639 4005H711V4113H639z"
						title="Колесо"
						id="truck3Wheels2Wheel1"
					></path>
					<path
						style={{ fill: this.state.truck3Wheels2Wheel2 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M2295 4005H2367V4113H2295z"
						title="Колесо"
						id="truck3Wheels2Wheel2"
					></path>
					<path
						style={{ fill: this.state.truck3Wheels2Bearing1 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M494.5 4041H567V4077H494.5z"
						title="Подшипник"
						id="truck3Wheels2Bearing1"
					></path>
					<path
						style={{ fill: this.state.truck3Wheels2Bearing2 ? '#DEEAD4' : 'red' }}
						stroke="#000"
						strokeMiterlimit="10"
						d="M2439 4041H2512V4077H2439z"
						title="Подшипник"
						id="truck3Wheels2Bearing2"
					></path>
				</g>
				<g stroke="#000" strokeMiterlimit="10">
					{/*адапрет подшипника*/}
					<path
						style={{ fill: this.state.truck3BearingAdapterL5 ? '#DEEAD4' : 'red' }}
						d="M747 3348H819V3411H747z"
						title="Адаптер подшипника L5"
						id="truck3BearingAdapterL5"
					></path>
					<path
						style={{ fill: this.state.truck3BearingAdapterR5 ? '#DEEAD4' : 'red' }}
						d="M2169 3348H2241V3411H2169z"
						transform="rotate(-180 2205 3379.5)"
						title="Адаптер подшипника R5"
						id="truck3BearingAdapterR5"
					></path>
					{/*Балка надрессорная*/}
					<path
						fill="#E6E6E6"
						d="M1107 3501H1899V3807H1107z"
						title="Балка надрессорная"
						id="truck3Nadressornybeam"
					></path>
					{/*Скользун l*/}
					<path
						fill="#E6E6E6"
						d="M855 3501H1107V3807H855z"
						title="Скользун L4"
						id="truck3SliderL4"
					></path>
					{/*Скользун r*/}
					<path
						fill="#E6E6E6"
						d="M1899 3501H2133V3807H1899z"
						title="Скользун R4"
						id="truck3SliderR4"
					></path>
					{/*адапрет подшипника*/}
					<path
						style={{ fill: this.state.truck3BearingAdapterL6 ? '#DEEAD4' : 'red' }}
						d="M747 3888H819V3951.5H747z"
						title="Адаптер подшипника L6"
						id="truck3BearingAdapterL6"
					></path>
					<path
						style={{ fill: this.state.truck3BearingAdapterR6 ? '#DEEAD4' : 'red' }}
						d="M2169 3888H2241V3951.5H2169z"
						title="Адаптер подшипника R6"
						id="truck3BearingAdapterR6"
					></path>
					{/*рама боковаяL*/}
					<path
						fill="#E6E6E6"
						d="M711 3411H855V3888H711z"
						title="Рама боковая"
						id="truck3SideframeL"
					></path>
					<path
						style={{ fill: this.state.truck3SideframeInL3 ? '#DEEAD4' : 'red' }}
						d="M747 3501H819V3537H747z"
						title="Рама боковая L3"
						id="truck3SideframeInL3"
					></path>
					{/*скоба*/}
					<path
						style={{ fill: this.state.truck3SideframeStapleL6 ? '#DEEAD4' : 'red' }}
						d="M747 3753H819V3789H747z"
						title="Скоба L6"
						id="truck3SideframeStapleL6"
					></path>
					<path
						style={{ fill: this.state.truck3SideframeStapleL5 ? '#DEEAD4' : 'red' }}
						d="M747 3537H819V3609H747z"
						title="Скоба L5"
						id="truck3SideframeStapleL5"
					></path>
					{/*Планка фрикционная*/}
					<path
						style={{ fill: this.state.truck3SideframeFrictionStripL5 ? '#DEEAD4' : 'red' }}
						d="M747 3609H819V3681H747z"
						title="Планка фрикционная L5"
						id="truck3SideframeFrictionStripL5"
					></path>
					<path
						style={{ fill: this.state.truck3SideframeFrictionStripL6 ? '#DEEAD4' : 'red' }}
						d="M747 3681H819V3753H747z"
						title="Планка фрикционная L6"
						id="truck3SideframeFrictionStripL6"
					></path>
					{/*Балка надресорная, элементы верхнего сегмента*/}
					<g fill="#DEEAD4">
						<path
							style={{ fill: this.state.truck3NadressornybeamPlastl9 ? '#DEEAD4' : 'red' }}
							d="M1170 3537H1251V3609H1170z"
							title="Пластина в клин. карм.l9"
							id="truck3NadressornybeamPlastl9"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamInsertl5 ? '#DEEAD4' : 'red' }}
							d="M1251 3537H1332V3609H1251z"
							title="Вставка в клин. карм.l5"
							id="truck3NadressornybeamInsertl5"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamPlastl10 ? '#DEEAD4' : 'red' }}
							d="M1332 3537H1413V3609H1332z"
							title="Пластина в клин. карм.l10"
							id="truck3NadressornybeamPlastl10"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamRing ? '#DEEAD4' : 'red' }}
							d="M1413 3537H1575V3609H1413z"
							title="Кольцо в подпятник"
							id="truck3NadressornybeamRing"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamPlastR10 ? '#DEEAD4' : 'red' }}
							d="M1575 3537H1656V3609H1575z"
							title="Пластина в клин. карм.R10"
							id="truck3NadressornybeamPlastR10"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamInsertR5 ? '#DEEAD4' : 'red' }}
							d="M1656 3537H1737V3609H1656z"
							title="Вставка в клин. карм.R5"
							id="truck3NadressornybeamInsertR5"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamPlastR9 ? '#DEEAD4' : 'red' }}
							d="M1737 3537H1818V3609H1737z"
							title="Пластина в клин. карм.R9"
							id="truck3NadressornybeamPlastR9"
						></path>
					</g>
					{/*Балка надресорная, элементы нижнего сегмента*/}
					<g fill="#DEEAD4">
						<path
							style={{ fill: this.state.truck3NadressornybeamBotoomPlastL11 ? '#DEEAD4' : 'red' }}
							d="M1170 3690H1251V3762H1170z"
							title="Пластина в клин. карм.L11"
							id="truck3NadressornybeamBotoomPlastL11"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamBotoomInsertL6 ? '#DEEAD4' : 'red' }}
							d="M1251 3690H1332V3762H1251z"
							title="Вставка в клин. карм.L6"
							id="truck3NadressornybeamBotoomInsertL6"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamBotoomPlastL12 ? '#DEEAD4' : 'red' }}
							d="M1332 3690H1413V3762H1332z"
							title="Пластина в клин. карм.L12"
							id="truck3NadressornybeamBotoomPlastL12"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamBotoomPlastR12 ? '#DEEAD4' : 'red' }}
							d="M1575 3690H1656V3762H1575z"
							title="Пластина в клин. карм.R12"
							id="truck3NadressornybeamBotoomPlastR12"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamBotoomInsertR6 ? '#DEEAD4' : 'red' }}
							d="M1656 3690H1737V3762H1656z"
							title="Вставка в клин. карм.R6"
							id="truck3NadressornybeamBotoomInsertR6"
						></path>
						<path
							style={{ fill: this.state.truck3NadressornybeamBotoomInsertR11 ? '#DEEAD4' : 'red' }}
							d="M1737 3690H1818V3762H1737z"
							title="Вставка в клин. карм.R11"
							id="truck3NadressornybeamBotoomInsertR11"
						></path>
					</g>
					{/*Скользун левый : элементы*/}
					<g fill="#DEEAD4">
						<path
							style={{ fill: this.state.truck3SliderLHead ? '#DEEAD4' : 'red' }}
							d="M945 3537H1017V3609H945z"
							title="Колпак скользуна"
							id="truck3SliderLHead"
						></path>
						<path
							style={{ fill: this.state.truck3SliderLInside ? '#DEEAD4' : 'red' }}
							d="M945 3609H1017V3681H945z"
							title="Скольз. пр. внутр.Скольз. пр. наруж."
							id="truck3SliderLInside"
						></path>
						<path
							style={{ fill: this.state.truck3SliderLBody ? '#DEEAD4' : 'red' }}
							d="M945 3681H1017V3753H945z"
							title="Корпус скользуна"
							id="truck3SliderLBody"
						></path>
					</g>
					{/*Скользун правый : элементы*/}
					<g fill="#DEEAD4">
						<path
							d="M1980 3546H2052V3618H1980z"
							title="Колпак скользуна"
							id="truck3SliderRHead"
							style={{ fill: this.state.truck3SliderRHead ? '#DEEAD4' : 'red' }}
						></path>
						<path
							style={{ fill: this.state.truck3SliderRInside ? '#DEEAD4' : 'red' }}
							d="M1980 3618H2052V3690H1980z"
							title="Скольз. пр. внутр.Скольз. пр. наруж."
							id="truck3SliderRInside"
						></path>
						<path
							style={{ fill: this.state.truck3SliderRBody ? '#DEEAD4' : 'red' }}
							d="M1980 3690H2052V3762H1980z"
							title="Корпус скользуна"
							id="truck3SliderRBody"
						></path>
					</g>
					{/*Клин L10*/}
					<path
						style={{ fill: this.state.truck3WedgeL10 ? '#DEEAD4' : 'red' }}
						d="M639 3501H711V3537H639z"
						title="Клин L10"
						id="truck3WedgeL10"
					></path>
					{/*Клин L12*/}
					<path
						style={{ fill: this.state.truck3WedgeL12 ? '#DEEAD4' : 'red' }}
						d="M639 3753H711V3789H639z"
						title="Клин L10"
						id="truck3WedgeL12"
					></path>
					{/*"Пружина внутр.Пружина наруж.L21"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL21 ? '#DEEAD4' : 'red' }}
						d="M639 3537H711V3609H639z"
						title="Пружина внутр.Пружина наруж.L21"
						id="truck3InsideSpringL21"
					></path>
					{/*"Пружина внутр.Пружина наруж.L24"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL24 ? '#DEEAD4' : 'red' }}
						d="M639 3609H711V3681H639z"
						title="Пружина внутр.Пружина наруж.L24"
						id="truck3InsideSpringL24"
					></path>
					{/*"Пружина внутр.Пружина наруж.L27"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL27 ? '#DEEAD4' : 'red' }}
						d="M639 3681H711V3753H639z"
						title="Пружина внутр.Пружина наруж.L27"
						id="truck3InsideSpringL27"
					></path>
					{/*Клин L9*/}
					<path
						style={{ fill: this.state.truck3WedgeL9 ? '#DEEAD4' : 'red' }}
						d="M567 3501H639V3537H567z"
						title="Клин L9"
						id="truck3WedgeL9"
					></path>
					{/*Клин L11*/}
					<path
						style={{ fill: this.state.truck3WedgeL11 ? '#DEEAD4' : 'red' }}
						d="M567 3753H639V3789H567z"
						title="Клин L11"
						id="truck3WedgeL11"
					></path>
					{/*"Пружина внутр.Пружина наруж. L20"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL20 ? '#DEEAD4' : 'red' }}
						d="M567 3537H639V3609H567z"
						title="Пружина внутр.Пружина наруж.L20"
						id="truck3InsideSpringL20"
					></path>
					{/*"Пружина внутр.Пружина наруж. L23"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL23 ? '#DEEAD4' : 'red' }}
						d="M567 3609H639V3681H567z"
						title="Пружина внутр.Пружина наруж.L23"
						id="truck3InsideSpringL23"
					></path>
					{/*"Пружина внутр.Пружина наруж. L26"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL26 ? '#DEEAD4' : 'red' }}
						d="M567 3681H639V3753H567z"
						title="Пружина внутр.Пружина наруж.L26"
						id="truck3InsideSpringL26"
					></path>
					{/*"Пружина внутр.Пружина наруж. L19"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL19 ? '#DEEAD4' : 'red' }}
						d="M495 3537H567V3609H495z"
						title="Пружина внутр.Пружина наруж.L19"
						id="truck3InsideSpringL19"
					></path>
					{/*"Пружина внутр.Пружина наруж. L22"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL22 ? '#DEEAD4' : 'red' }}
						d="M495 3609H567V3681H495z"
						title="Пружина внутр.Пружина наруж.L22"
						id="truck3InsideSpringL22"
					></path>
					{/*"Пружина внутр.Пружина наруж. L25"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringL25 ? '#DEEAD4' : 'red' }}
						d="M495 3681H567V3753H495z"
						title="Пружина внутр.Пружина наруж.L25"
						id="truck3InsideSpringL25"
					></path>
					{/*Рама боковая правая R*/}
					<path
						fill="#E6E6E6"
						d="M2133 3411H2277V3888H2133z"
						transform="rotate(-180 2205 3649.5)"
						title="Рама боковая"
						id="truck3SideframeR"
					></path>
					{/*Рама боковая правая: элементы*/}
					{/*рама боковаяR3*/}
					<path
						style={{ fill: this.state.truck3SideframeInR3 ? '#DEEAD4' : 'red' }}
						d="M2169 3501H2241V3537H2169z"
						transform="rotate(-180 2205 3519)"
						title="Рама боковая R3"
						id="truck3SideframeInR3"
					></path>
					{/*скоба*/}
					<path
						style={{ fill: this.state.truck3SideframeStapleR5 ? '#DEEAD4' : 'red' }}
						d="M2169 3753H2241V3789H2169z"
						transform="rotate(-180 2205 3771)"
						title="Скоба R5"
						id="truck3SideframeStapleR5"
					></path>
					<path
						style={{ fill: this.state.truck3SideframeStapleR6 ? '#DEEAD4' : 'red' }}
						d="M2169 3537H2241V3609H2169z"
						transform="rotate(-180 2205 3573)"
						title="Скоба R6"
						id="truck3SideframeStapleR6"
					></path>
					{/*Планка фрикционная*/}
					<path
						style={{ fill: this.state.truck3SideframeFrictionStripR5 ? '#DEEAD4' : 'red' }}
						d="M2169 3609H2241V3681H2169z"
						transform="rotate(-180 2205 3645)"
						title="Планка фрикционная R5"
						id="truck3SideframeFrictionStripR5"
					></path>
					<path
						style={{ fill: this.state.truck3SideframeFrictionStripR6 ? '#DEEAD4' : 'red' }}
						d="M2169 3681H2241V3753H2169z"
						transform="rotate(-180 2205 3717)"
						title="Планка фрикционная R6"
						id="truck3SideframeFrictionStripR6"
					></path>
					{/*Клин R10*/}
					<path
						style={{ fill: this.state.truck3WedgeR10 ? '#DEEAD4' : 'red' }}
						d="M2277 3501H2349V3537H2277z"
						transform="rotate(-180 2313 3519)"
						title="Клин R10"
						id="truck3WedgeR10"
					></path>
					{/*Клин R12*/}
					<path
						style={{ fill: this.state.truck3WedgeR12 ? '#DEEAD4' : 'red' }}
						d="M2277 3753H2349V3789H2277z"
						transform="rotate(-180 2313 3771)"
						title="Клин R12"
						id="truck3WedgeR12"
					></path>
					{/*"Пружина внутр.Пружина наруж.R21"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR21 ? '#DEEAD4' : 'red' }}
						d="M2277 3537H2349V3609H2277z"
						transform="rotate(-180 2313 3573)"
						title="Пружина внутр.Пружина наруж.R21"
						id="truck3InsideSpringR21"
					></path>
					{/*"Пружина внутр.Пружина наруж.R24"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR24 ? '#DEEAD4' : 'red' }}
						d="M2277 3609H2349V3681H2277z"
						transform="rotate(-180 2313 3645)"
						title="Пружина внутр.Пружина наруж.R24"
						id="truck3InsideSpringR24"
					></path>
					{/*"Пружина внутр.Пружина наруж.R27"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR27 ? '#DEEAD4' : 'red' }}
						d="M2277 3681H2349V3753H2277z"
						transform="rotate(-180 2313 3717)"
						title="Пружина внутр.Пружина наруж.R27"
						id="truck3InsideSpringR27"
					></path>
					{/*Клин R9*/}
					<path
						style={{ fill: this.state.truck3Wedger9 ? '#DEEAD4' : 'red' }}
						d="M2349 3501H2421V3537H2349z"
						transform="rotate(-180 2385 3519)"
						title="Клин R9"
						id="truck3Wedger9"
					></path>
					{/*Клин R11*/}
					<path
						style={{ fill: this.state.truck3Wedger11 ? '#DEEAD4' : 'red' }}
						d="M2349 3753H2421V3789H2349z"
						transform="rotate(-180 2385 3771)"
						title="Клин R11"
						id="truck3Wedger11"
					></path>
					{/*"Пружина внутр.Пружина наруж. R20"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR20 ? '#DEEAD4' : 'red' }}
						d="M2349 3537H2421V3609H2349z"
						transform="rotate(-180 2385 3573)"
						title="Пружина внутр.Пружина наруж.R20"
						id="truck3InsideSpringR20"
					></path>
					{/*"Пружина внутр.Пружина наруж. R23"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR23 ? '#DEEAD4' : 'red' }}
						d="M2349 3609H2421V3681H2349z"
						transform="rotate(-180 2385 3645)"
						title="Пружина внутр.Пружина наруж.R23"
						id="truck3InsideSpringR23"
					></path>
					{/*"Пружина внутр.Пружина наруж. R26"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR26 ? '#DEEAD4' : 'red' }}
						d="M2349 3681H2421V3753H2349z"
						transform="rotate(-180 2385 3717)"
						title="Пружина внутр.Пружина наруж.R26"
						id="truck3InsideSpringR26"
					></path>
					{/*"Пружина внутр.Пружина наруж. R19"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR19 ? '#DEEAD4' : 'red' }}
						d="M2421 3537H2493V3609H2421z"
						transform="rotate(-180 2457 3573)"
						title="Пружина внутр.Пружина наруж.R19"
						id="truck3InsideSpringR19"
					></path>
					{/*"Пружина внутр.Пружина наруж. R22"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR22 ? '#DEEAD4' : 'red' }}
						d="M2421 3609H2493V3681H2421z"
						transform="rotate(-180 2457 3645)"
						title="Пружина внутр.Пружина наруж.R22"
						id="truck3InsideSpringR22"
					></path>
					{/*"Пружина внутр.Пружина наруж. R25"*/}
					<path
						style={{ fill: this.state.truck3InsideSpringR25 ? '#DEEAD4' : 'red' }}
						d="M2421 3681H2493V3753H2421z"
						transform="rotate(-180 2457 3717)"
						title="Пружина внутр.Пружина наруж.R25"
						id="truck3InsideSpringR25"
					></path>
					{/*Триангель L5*/}
					<path
						fill="#E6E6E6"
						d="M1332 3420H1656V3465H1332z"
						title="Триангель 5"
						id="truck3TriangelL5"
					></path>
					{/*Вкладыш подпятника L3*/}
					<path
						style={{ fill: this.state.truck3ThrustBearing3 ? '#DEEAD4' : 'red' }}
						d="M1332 3465H1656V3501H1332z"
						title="Вкладыш подпятника 3"
						id="truck3ThrustBearing3"
					></path>
					{/*Триангель L6*/}
					<path
						fill="#E6E6E6"
						d="M1332 3807H1656V3843H1332z"
						title="Триангель 6"
						id="truck3TriangelL6"
					></path>
					{/*Балка надрессорная 3*/}
					<path
						style={{ fill: this.state.truck3Nadressornybeam3 ? '#DEEAD4' : 'red' }}
						d="M1170 3609H1818V3690H1170z"
						title="Балка надрессорная 3"
						id="truck3Nadressornybeam3"
					></path>
				</g>
			</g>
			);
	}
}