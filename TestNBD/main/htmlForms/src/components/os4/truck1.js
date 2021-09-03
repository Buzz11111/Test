import React, { Component } from 'react';

export default class Truck1 extends Component {
	constructor(props) {
		super(props);

		this.state = {
			truck1WheelsWhithoutStopNodeAxis1: false, /*Ось чистовая 1*/
			truck1WheelsWhithoutStopNodeAxis2: false, /*Ось черновая*/
			truck1Wheels1WheelL1: false, /*Колесо L1*/
			truck1Wheels1WheelR2: false, /*Колесо R1*/
			truck1Wheels1BearingL1: false, /*Подшипник L1*/
			truck1Wheels1BearingR2: false, /*Подшипник R1*/
			truck1Wheels2WhithoutStopNodeAxis1: false, /*Ось чистовая 2*/
			truck1Wheels2WhithoutStopNodeAxis2: false, /*Ось черновая*/
			truck1Wheels2WheelL2: false, /*Колесо L2*/
			truck1Wheels2WheeLR2: false, /*Колесо R2*/
			truck1Wheels2BearingL2: false, /*Подшипник L2*/
			truck1Wheels2BearingR2: false, /*Подшипник R2*/
			truck1BearingAdapterL1: false, /*Адаптер подшипника L1*/
			truck1BearingAdapterR1: false, /*Адаптер подшипника R1*/
			truck1BearingAdapterL2: false, /*Адаптер подшипника L2*/
			truck1BearingAdapterR2: false, /*Адаптер подшипника R2*/
			truck1SideframeInL1: false, /*Скользун L1*/
			truck1SideframeStapleL2: false, /*Скоба L2*/
			truck1SideframeStapleL1: false, /*Скоба L1*/
			truck1SideframeFrictionStripL1: false, /*Планка фрикц. L1*/
			truck1SideframeFrictionStripL2: false, /*Планка фрикц. L2*/
			truck1NadressornybeamPlastL1: false, /*Пластина в клин. карм. L1*/
			truck1NadressornybeamInsertL1: false, /*Вставка в клин. карм. L1*/
			truck1NadressornybeamPlastL2: false, /*Пластина в клин. карм. L2*/
			truck1NadressornybeamRing1: false, /*"Кольцо в подпятник" 1 */
			truck1NadressornybeamPlastR2: false, /*Пластина в клин. карм. R2*/
			truck1NadressornybeamInsertR1: false, /*Вставка в клин. карм. R1*/
			truck1NadressornybeamPlastR2: false, /*Пластина в клин. карм. R1*/
			truck1NadressornybeamBotoomPlastL3: false, /*Пластина в клин. карм. L3*/
			truck1NadressornybeamBotoomInsertL2: false, /*Вставка в клин. карм. L2*/
			truck1NadressornybeamBotoomPlastL4: false, /*Пластина в клин. карм. L4*/
			truck1NadressornybeamBotoomPlastR4: false, /*Пластина в клин. карм. R4*/
			truck1NadressornybeamBotoomInsertR4: false, /*Вставка в клин. карм. R2*/
			truck1NadressornybeamBotoomPlastR3: false, /*Пластина в клин. карм. R3*/
			truck1SliderLHeadL1: false, /*Колпак скользуна L1*/
			truck1SliderLInsideL1: false, /*"Скольз. пр. внутр.Скольз. пр. наруж." L1*/
			truck1SliderLBodyL1: false, /*Корпус скользуна L1*/
			truck1SliderRHeadR1: false, /*Колпак скользуна R1*/
			truck1SliderRInsideR1: false, /*"Скольз. пр. внутр.Скольз. пр. наруж." R1*/
			truck1SliderRBodyR1: false, /* Корпус скользуна R1*/
			truck1WedgeL2: false, /*Клин L2*/
			truck1WedgeL4: false, /*Клин L4*/
			truck1InsideSpringL3: false, /*"Пружина внутр.Пружина наруж." L3*/
			truck1InsideSpringL6: false, /*"Пружина внутр.Пружина наруж." L6*/
			truck1InsideSpringL9: false, /*"Пружина внутр.Пружина наруж." L9*/
			truck1WedgeL1: false, /*Клин L1*/
			truck1WedgeL3: false, /*Клин L3*/
			truck1InsideSpringL2: false, /*"Пружина внутр.Пружина наруж." L2*/
			truck1InsideSpringL5: false, /*"Пружина внутр.Пружина наруж." L5*/
			truck1InsideSpringL8: false, /*"Пружина внутр.Пружина наруж." L8*/
			truck1InsideSpringL1: false, /*"Пружина внутр.Пружина наруж." L1*/
			truck1InsideSpringL4: false, /*"Пружина внутр.Пружина наруж." L4*/
			truck1InsideSpringL7: false, /*"Пружина внутр.Пружина наруж." L7*/
			truck1SideframeStapleR2: false, /*Скоба R2*/
			truck1SideframeStapleR1: false, /*Скоба R1*/
			truck1SideframeFrictionStripR1: false, /*Планка фрикц. R1*/
			truck1SideframeFrictionStripR2: false, /*Планка фрикц. R2*/
			truck1WedgeR2: false, /*Клин R2*/
			truck1WedgeR4: false, /*Клин R4*/
			truck1InsideSpringR3: false, /*"Пружина внутр.Пружина наруж." R3*/
			truck1InsideSpringR6: false, /*"Пружина внутр.Пружина наруж." R6*/
			truck1InsideSpringR9: false, /*"Пружина внутр.Пружина наруж." R9*/
			truck1WedgerR1: false, /*Клин R1*/
			truck1WedgerR3: false, /*Клин R3*/
			truck1InsideSpringR2: false, /*"Пружина внутр.Пружина наруж." R2*/
			truck1InsideSpringR5: false, /*"Пружина внутр.Пружина наруж." R5*/
			truck1InsideSpringR8: false, /*"Пружина внутр.Пружина наруж." R8*/
			truck1InsideSpringR1: false, /*"Пружина внутр.Пружина наруж." R1*/
			truck1InsideSpringR4: false, /*"Пружина внутр.Пружина наруж." R4*/
			truck1InsideSpringR7: false, /*"Пружина внутр.Пружина наруж." R7*/
			truck1TriangelL1: false, /*Триангель 1*/
			truck1ThrustBearingL: false, /*Вкладыш подпятника 1*/
			truck1TriangelL2: false, /*Триангель 2*/
			truck1Nadressornybeam1: false, /*Балка надрессорная 1*/
			truck1SideframeInR1: false, /*Рама боковая R1*/
		}
	}

	componentDidMount() {
		if (window.truck1Data) {
			this.setState(window.truck1Data);
		}
	}

	render() {
		return (
			<g>
				{/*тележка 1*/}
				<path id="truck1"
					fill="#F2F2F2"
					stroke="#000"
					strokeMiterlimit="10"
					d="M387 450H2619V1683H387z"
					title="Тележка 1"
				></path>
				{/*колесная пара 1*/}
				<path
					fill="#F2F2F2"
					d="M423.5 486.5H2582.5V764.5H423.5z"
					title="Колесная пара 1"
					id="truck1Wheels1"
				></path>
				<path d="M2582 487v277H424V487h2158m1-1H423v279h2160V486z"></path>
				<path
					fill="#E6E6E6"
					stroke="#000"
					strokeMiterlimit="10"
					d="M567 513H2439V738H567z"
					title="Колесная пара без буксовых узлов 1"
					id="truck1WheelsWhithoutStopNode"
				></path>
				<path
					style={{ fill: this.state.truck1WheelsWhithoutStopNodeAxis1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M693 576H2295V611.5H693z"
					title="Ось чистовая"
					id="truck1WheelsWhithoutStopNodeAxis1"
				></path>
				<path
					style={{ fill: this.state.truck1WheelsWhithoutStopNodeAxis2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M693 611.5H2295V648H693z"
					title="Ось чистовая"
					id="truck1WheelsWhithoutStopNodeAxis2"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels1WheelL1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M639 540H711V648H639z"
					title="Колесо L1"
					id="truck1Wheels1WheelL1"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels1WheelR2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M2295 540H2367V648H2295z"
					title="Колесо R1"
					id="truck1Wheels1WheelR2"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels1BearingL1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M494.5 576H567V612H494.5z"
					title="Подшипник L1"
					id="truck1Wheels1BearingL1"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels1BearingR2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M2439 576H2512V612H2439z"
					title="Подшипник R2"
					id="truck1Wheels1BearingR2"
				></path>
				{/*колесная пара 2*/}
				<path
					fill="#F2F2F2"
					d="M423.5 1368.5H2582.5V1646.5H423.5z"
					title="Колесная пара 2"
					id="truck1Wheels2"
				></path>
				<path d="M2582 1369v277H424v-277h2158m1-1H423v279h2160v-279z"></path>
				<path
					fill="#E6E6E6"
					stroke="#000"
					strokeMiterlimit="10"
					d="M567 1395H2439V1620H567z"
					title="Колесная пара без буксовых узлов 2"
					id="truck1Wheels2WhithoutStopNode"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels2WhithoutStopNodeAxis1 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M693 1458H2295V1493.5H693z"
					title="Ось чистовая"
					id="truck1Wheels2WhithoutStopNodeAxis1"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels2WhithoutStopNodeAxis2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M693 1493.5H2295V1530H693z"
					title="Ось чистовая"
					id="truck1Wheels2WhithoutStopNodeAxis2"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels2WheelL2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M639 1422H711V1530H639z"
					title="Колесо L2"
					id="truck1Wheels2WheelL2"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels2WheeLR2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M2295 1422H2367V1530H2295z"
					title="Колесо R2"
					id="truck1Wheels2WheeLR2"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels2BearingL2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M494.5 1458H567V1494H494.5z"
					title="Подшипник L2"
					id="truck1Wheels2BearingL2"
				></path>
				<path
					style={{ fill: this.state.truck1Wheels2BearingR2 ? '#DEEAD4' : 'red' }}
					stroke="#000"
					strokeMiterlimit="10"
					d="M2439 1458H2512V1494H2439z"
					title="Подшипник R2"
					id="truck1Wheels2BearingR2"
				></path>
				<g stroke="#000" strokeMiterlimit="10">
					{/*адапрет подшипника*/}
					<path
						style={{ fill: this.state.truck1BearingAdapterL1 ? '#DEEAD4' : 'red' }}
						d="M765 765H837V828H765z"
						title="Адаптер подшипника L1"
						id="truck1BearingAdapterL1"
					></path>
					<path
						style={{ fill: this.state.truck1BearingAdapterR1 ? '#DEEAD4' : 'red' }}
						d="M2187 765H2259V828H2187z"
						transform="rotate(-180 2223 796.5)"
						title="Адаптер подшипника R1"
						id="truck1BearingAdapterR1"
					></path>
					{/*Балка надрессорная*/}
					<path
						fill="#E6E6E6"
						d="M1125 918H1917V1224H1125z"
						title="Балка надрессорная"
						id="truck1Nadressornybeam"
					></path>
					{/*Скользун l*/}
					<path
						fill="#E6E6E6"
						d="M873 918H1125V1224H873z"
						title="Скользун"
						id="truck1SliderL"
					></path>
					{/*Скользун r*/}
					<path
						fill="#E6E6E6"
						d="M1917 918H2151V1224H1917z"
						title="Скользун"
						id="truck1SliderR"
					></path>
					{/*адапрет подшипника*/}
					<path
						style={{ fill: this.state.truck1BearingAdapterL2 ? '#DEEAD4' : 'red' }}
						d="M765 1305H837V1368.5H765z"
						title="Адаптер подшипника"
						id="truck1BearingAdapterL2"
					></path>
					<path
						style={{ fill: this.state.truck1BearingAdapterR2 ? '#DEEAD4' : 'red' }}
						d="M2187 1305H2259V1368.5H2187z"
						title="Адаптер подшипника"
						id="truck1BearingAdapterR2"
					></path>
					{/*рама боковаяL*/}
					<path
						fill="#E6E6E6"
						d="M729 828H873V1305H729z"
						title="Рама боковая"
						id="truck1SideframeL"
					></path>
					<path
						style={{ fill: this.state.truck1SideframeInL1 ? '#DEEAD4' : 'red' }}
						d="M765 918H837V954H765z"
						title="Рама боковая L1"
						id="truck1SideframeInL1"
					></path>
					{/*скоба*/}
					<path
						style={{ fill: this.state.truck1SideframeStapleL2 ? '#DEEAD4' : 'red' }}
						d="M765 1170H837V1206H765z"
						title="Скоба L2"
						id="truck1SideframeStapleL2"
					></path>
					<path
						style={{ fill: this.state.truck1SideframeStapleL1 ? '#DEEAD4' : 'red' }}
						d="M765 954H837V1026H765z"
						title="Скоба"
						id="truck1SideframeStapleL1"
					></path>
					{/*Планка фрикционная*/}
					<path
						style={{ fill: this.state.truck1SideframeFrictionStripL1 ? '#DEEAD4' : 'red' }}
						d="M765 1026H837V1098H765z"
						title="Планка фрикционная L1"
						id="truck1SideframeFrictionStripL1"
					></path>
					<path
						style={{ fill: this.state.truck1SideframeFrictionStripL2 ? '#DEEAD4' : 'red' }}
						d="M765 1098H837V1170H765z"
						title="Планка фрикционная L2"
						id="truck1SideframeFrictionStripL2"
					></path>
					{/*Балка надресорная, элементы верхнего сегмента*/}
					<g fill="#DEEAD4">
						{/*Пластина в клин. карм.l1*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamPlastL1 ? '#DEEAD4' : 'red' }}
							d="M1188 954H1269V1026H1188z"
							title="Пластина в клин. карм.L1"
							id="truck1NadressornybeamPlastL1"
						></path>
						{/*Вставка в клин. карм.l1*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamInsertL1 ? '#DEEAD4' : 'red' }}
							d="M1269 954H1350V1026H1269z"
							title="Вставка в клин. карм.L1"
							id="truck1NadressornybeamInsertL1"
						></path>
						{/*Пластина в клин. карм.l2*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamPlastL2 ? '#DEEAD4' : 'red' }}
							d="M1350 954H1431V1026H1350z"
							title="Пластина в клин. карм.L2"
							id="truck1NadressornybeamPlastL2"
						></path>
						{/*"Кольцо в подпятник"*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamRing1 ? '#DEEAD4' : 'red' }}
							d="M1431 954H1593V1026H1431z"
							title="Кольцо в подпятник "
							id="truck1NadressornybeamRing1"
						></path>
						{/*"Пластина в клин. карм.r2"*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamPlastR2 ? '#DEEAD4' : 'red' }}
							d="M1593 954H1674V1026H1593z"
							title="Пластина в клин. карм.R2"
							id="truck1NadressornybeamPlastR2"
						></path>
						{/*Вставка в клин. карм.r1*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamInsertR1 ? '#DEEAD4' : 'red' }}
							d="M1674 954H1755V1026H1674z"
							title="Вставка в клин. карм.R1"
							id="truck1NadressornybeamInsertR1"
						></path>
						{/*Пластина в клин. карм.r1*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamPlastR2 ? '#DEEAD4' : 'red' }}
							d="M1755 954H1836V1026H1755z"
							title="Пластина в клин. карм.r2"
							id="truck1NadressornybeamPlastR2"
						></path>
					</g>
					{/*Балка надресорная, элементы нижнего сегмента*/}
					<g fill="#DEEAD4">
						{/*Пластина в клин. карм.l3*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamBotoomPlastL3 ? '#DEEAD4' : 'red' }}
							d="M1188 1107H1269V1179H1188z"
							title="Пластина в клин. карм.L3"
							id="truck1NadressornybeamBotoomPlastL3"
						></path>
						{/*Вставка в клин. карм.l2*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamBotoomInsertL2 ? '#DEEAD4' : 'red' }}
							d="M1269 1107H1350V1179H1269z"
							title="Вставка в клин. карм.L2"
							id="truck1NadressornybeamBotoomInsertL2"
						></path>
						{/*Пластина в клин. карм.l4*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamBotoomPlastL4 ? '#DEEAD4' : 'red' }}
							d="M1350 1107H1431V1179H1350z"
							title="Пластина в клин. карм.L4"
							id="truck1NadressornybeamBotoomPlastL4"
						></path>
						{/*"Пластина в клин. карм.r4"*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamBotoomPlastR4 ? '#DEEAD4' : 'red' }}
							d="M1593 1107H1674V1179H1593z"
							title="Пластина в клин. карм.R4"
							id="truck1NadressornybeamBotoomPlastR4"
						></path>
						{/*Вставка в клин. карм.r4*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamBotoomInsertR4 ? '#DEEAD4' : 'red' }}
							d="M1674 1107H1755V1179H1674z"
							title="Вставка в клин. карм.R4"
							id="truck1NadressornybeamBotoomInsertR4"
						></path>
						{/*Пластина в клин. карм.r3*/}
						<path
							style={{ fill: this.state.truck1NadressornybeamBotoomPlastR3 ? '#DEEAD4' : 'red' }}
							d="M1755 1107H1836V1179H1755z"
							title="Пластина в клин. карм.R3"
							id="truck1NadressornybeamBotoomPlastR3"
						></path>
					</g>
					{/*Скользун левый : элементы*/}
					<g fill="#DEEAD4">
						{/*Колпак скользуна*/}
						<path
							style={{ fill: this.state.truck1SliderLHeadL1 ? '#DEEAD4' : 'red' }}
							d="M963 954H1035V1026H963z"
							title="Колпак скользуна L1"
							id="truck1SliderLHeadL1"
						></path>
						{/*Скольз. пр. внутр.Скольз. пр. наруж.*/}
						<path
							style={{ fill: this.state.truck1SliderLInsideL1 ? '#DEEAD4' : 'red' }}
							d="M963 1026H1035V1098H963z"
							title="Скольз. пр. внутр.Скольз. пр. наруж. L1"
							id="truck1SliderLInsideL1"
						></path>
						{/*Корпус скользуна*/}
						<path
							style={{ fill: this.state.truck1SliderLBodyL1 ? '#DEEAD4' : 'red' }}
							d="M963 1098H1035V1170H963z"
							title="Корпус скользуна L1"
							id="truck1SliderLBodyL1"
						></path>
					</g>
					{/*Скользун правый : элементы*/}
					<g fill="#DEEAD4">
						{/*Колпак скользуна*/}
						<path
							style={{ fill: this.state.truck1SliderRHeadR1 ? '#DEEAD4' : 'red' }}
							d="M1998 963H2070V1035H1998z"
							title="Колпак скользуна R1"
							id="truck1SliderRHeadR1"
						></path>
						{/*Скольз. пр. внутр.Скольз. пр. наруж.*/}
						<path
							style={{ fill: this.state.truck1SliderRInsideR1 ? '#DEEAD4' : 'red' }}
							d="M1998 1035H2070V1107H1998z"
							title="Скольз. пр. внутр.Скольз. пр. наруж. R1"
							id="truck1SliderRInsideR1"
						></path>
						{/*Корпус скользуна*/}
						<path
							style={{ fill: this.state.truck1SliderRBodyR1 ? '#DEEAD4' : 'red' }}
							d="M1998 1107H2070V1179H1998z"
							title="Корпус скользуна R1"
							id="truck1SliderRBodyR1"
						></path>
					</g>
					{/*Клин L2*/}
					<path
						style={{ fill: this.state.truck1WedgeL2 ? '#DEEAD4' : 'red' }}
						d="M657 918H729V954H657z"
						title="Клин L2"
						id="truck1WedgeL2"
					></path>
					{/*Клин L4*/}
					<path
						style={{ fill: this.state.truck1WedgeL4 ? '#DEEAD4' : 'red' }}
						d="M657 1170H729V1206H657z"
						title="Клин L4"
						id="truck1WedgeL4"
					></path>
					{/*"Пружина внутр.Пружина наруж.L3"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL3 ? '#DEEAD4' : 'red' }}
						d="M657 954H729V1026H657z"
						title="Пружина внутр.Пружина наруж.L3"
						id="truck1InsideSpringL3"
					></path>
					{/*"Пружина внутр.Пружина наруж. L6"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL6 ? '#DEEAD4' : 'red' }}
						d="M657 1026H729V1098H657z"
						title="Пружина внутр.Пружина наруж.L6"
						id="truck1InsideSpringL6"
					></path>
					{/*"Пружина внутр.Пружина наруж. L9"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL9 ? '#DEEAD4' : 'red' }}
						d="M657 1098H729V1170H657z"
						title="Пружина внутр.Пружина наруж.L9"
						id="truck1InsideSpringL9"
					></path>
					{/*Клин L1*/}
					<path
						style={{ fill: this.state.truck1WedgeL1 ? '#DEEAD4' : 'red' }}
						d="M585 918H657V954H585z"
						title="Клин L1"
						id="truck1WedgeL1"
					></path>
					{/*Клин L3*/}
					<path
						style={{ fill: this.state.truck1WedgeL3 ? '#DEEAD4' : 'red' }}
						d="M585 1170H657V1206H585z"
						title="Клин L3"
						id="truck1WedgeL3"
					></path>
					{/*"Пружина внутр.Пружина наруж. L2"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL2 ? '#DEEAD4' : 'red' }}
						d="M585 954H657V1026H585z"
						title="Пружина внутр.Пружина наруж.L2"
						id="truck1InsideSpringL2"
					></path>
					{/*"Пружина внутр.Пружина наруж. L5"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL5 ? '#DEEAD4' : 'red' }}
						d="M585 1026H657V1098H585z"
						title="Пружина внутр.Пружина наруж.L5"
						id="truck1InsideSpringL5"
					></path>
					{/*"Пружина внутр.Пружина наруж. L8"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL8 ? '#DEEAD4' : 'red' }}
						d="M585 1098H657V1170H585z"
						title="Пружина внутр.Пружина наруж.L8"
						id="truck1InsideSpringL8"
					></path>
					{/*"Пружина внутр.Пружина наруж. L1"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL1 ? '#DEEAD4' : 'red' }}
						d="M513 954H585V1026H513z"
						title="Пружина внутр.Пружина наруж.L1"
						id="truck1InsideSpringL1"
					></path>
					{/*"Пружина внутр.Пружина наруж. L4"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL4 ? '#DEEAD4' : 'red' }}
						d="M513 1026H585V1098H513z"
						title="Пружина внутр.Пружина наруж.L4"
						id="truck1InsideSpringL4"
					></path>
					{/*"Пружина внутр.Пружина наруж. L7"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringL7 ? '#DEEAD4' : 'red' }}
						d="M513 1098H585V1170H513z"
						title="Пружина внутр.Пружина наруж.L7"
						id="truck1InsideSpringL7"
					></path>
					{/*Рама боковая правая R*/}
					<path
						fill="#E6E6E6"
						d="M2151 828H2295V1305H2151z"
						transform="rotate(-180 2223 1066.5)"
						title="Рама боковая"
						id="truck1SideframeR"
					></path>
					{/*Рама боковая правая: элементы*/}
					{/*рама боковаяR*/}
					<path
						style={{ fill: this.state.truck1SideframeInR1 ? '#DEEAD4' : 'red' }}
						d="M2187 918H2259V954H2187z"
						transform="rotate(-180 2223 936)"
						title="Рама боковая R1"
						id="truck1SideframeInR1"
					></path>
					{/*скоба*/}
					<path
						style={{ fill: this.state.truck1SideframeStapleR2 ? '#DEEAD4' : 'red' }}
						d="M2187 1170H2259V1206H2187z"
						transform="rotate(-180 2223 1188)"
						title="Скоба R2"
						id="truck1SideframeStapleR2"
					></path>
					<path
						style={{ fill: this.state.truck1SideframeStapleR1 ? '#DEEAD4' : 'red' }}
						d="M2187 954H2259V1026H2187z"
						transform="rotate(-180 2223 990)"
						title="Скоба R1"
						id="truck1SideframeStapleR1"
					></path>
					{/*Планка фрикционная*/}
					<path
						style={{ fill: this.state.truck1SideframeFrictionStripR1 ? '#DEEAD4' : 'red' }}
						d="M2187 1026H2259V1098H2187z"
						transform="rotate(-180 2223 1062)"
						title="Планка фрикционная R1"
						id="truck1SideframeFrictionStripR1"
					></path>
					<path
						style={{ fill: this.state.truck1SideframeFrictionStripR2 ? '#DEEAD4' : 'red' }}
						d="M2187 1098H2259V1170H2187z"
						transform="rotate(-180 2223 1134)"
						title="Планка фрикционная R2"
						id="truck1SideframeFrictionStripR2"
					></path>

					{/*Клин R2*/}
					<path
						style={{ fill: this.state.truck1WedgeR2 ? '#DEEAD4' : 'red' }}
						d="M2295 918H2367V954H2295z"
						transform="rotate(-180 2331 936)"
						title="Клин R2"
						id="truck1WedgeR2"
					></path>
					{/*Клин R4*/}
					<path
						style={{ fill: this.state.truck1WedgeR4 ? '#DEEAD4' : 'red' }}
						d="M2295 1170H2367V1206H2295z"
						transform="rotate(-180 2331 1188)"
						title="Клин R4"
						id="truck1WedgeR4"
					></path>
					{/*"Пружина внутр.Пружина наруж.R3"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR3 ? '#DEEAD4' : 'red' }}
						d="M2295 954H2367V1026H2295z"
						transform="rotate(-180 2331 990)"
						title="Пружина внутр.Пружина наруж.R3"
						id="truck1InsideSpringR3"
					></path>
					{/*"Пружина внутр.Пружина наруж.R6"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR6 ? '#DEEAD4' : 'red' }}
						d="M2295 1026H2367V1098H2295z"
						transform="rotate(-180 2331 1062)"
						title="Пружина внутр.Пружина наруж.R6"
						id="truck1InsideSpringR6"
					></path>
					{/*"Пружина внутр.Пружина наруж.R9"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR9 ? '#DEEAD4' : 'red' }}
						d="M2295 1098H2367V1170H2295z"
						transform="rotate(-180 2331 1134)"
						title="Пружина внутр.Пружина наруж.R9"
						id="truck1InsideSpringR9"
					></path>
					{/*Клин R1*/}
					<path
						style={{ fill: this.state.truck1WedgerR1 ? '#DEEAD4' : 'red' }}
						d="M2367 918H2439V954H2367z"
						transform="rotate(-180 2403 936)"
						title="Клин R1"
						id="truck1WedgerR1"
					></path>
					{/*Клин R3*/}
					<path
						style={{ fill: this.state.truck1WedgerR3 ? '#DEEAD4' : 'red' }}
						d="M2367 1170H2439V1206H2367z"
						transform="rotate(-180 2403 1188)"
						title="Клин R3"
						id="truck1WedgerR3"
					></path>
					{/*"Пружина внутр.Пружина наруж. R2"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR2 ? '#DEEAD4' : 'red' }}
						d="M2367 954H2439V1026H2367z"
						transform="rotate(-180 2403 990)"
						title="Пружина внутр.Пружина наруж.R2"
						id="truck1InsideSpringR2"
					></path>
					{/*"Пружина внутр.Пружина наруж. R5"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR5 ? '#DEEAD4' : 'red' }}
						d="M2367 1026H2439V1098H2367z"
						transform="rotate(-180 2403 1062)"
						title="Пружина внутр.Пружина наруж.R5"
						id="truck1InsideSpringR5"
					></path>
					{/*"Пружина внутр.Пружина наруж. R8"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR8 ? '#DEEAD4' : 'red' }}
						d="M2367 1098H2439V1170H2367z"
						transform="rotate(-180 2403 1134)"
						title="Пружина внутр.Пружина наруж.R8"
						id="truck1InsideSpringR8"
					></path>
					{/*"Пружина внутр.Пружина наруж. R1"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR1 ? '#DEEAD4' : 'red' }}
						d="M2439 954H2511V1026H2439z"
						transform="rotate(-180 2475 990)"
						title="Пружина внутр.Пружина наруж.R1"
						id="truck1InsideSpringR1"
					></path>
					{/*"Пружина внутр.Пружина наруж. R4"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR4 ? '#DEEAD4' : 'red' }}
						d="M2439 1026H2511V1098H2439z"
						transform="rotate(-180 2475 1062)"
						title="Пружина внутр.Пружина наруж.R4"
						id="truck1InsideSpringR4"
					></path>
					{/*"Пружина внутр.Пружина наруж. R7"*/}
					<path
						style={{ fill: this.state.truck1InsideSpringR7 ? '#DEEAD4' : 'red' }}
						d="M2439 1098H2511V1170H2439z"
						transform="rotate(-180 2475 1134)"
						title="Пружина внутр.Пружина наруж.R7"
						id="truck1InsideSpringR7"
					></path>
					{/*Триангель L1*/}
					<path
						fill="#E6E6E6"
						d="M1350 837H1674V882H1350z"
						title="Триангель 1"
						id="truck1TriangelL1"
					></path>
					{/*Вкладыш подпятника L*/}
					<path
						style={{ fill: this.state.truck1ThrustBearingL ? '#DEEAD4' : 'red' }}
						d="M1350 882H1674V918H1350z"
						title="Вкладыш подпятника 1"
						id="truck1ThrustBearingL"
					></path>
					{/*Триангель L2*/}
					<path
						fill="#E6E6E6"
						d="M1350 1224H1674V1260H1350z"
						title="Триангель 2"
						id="truck1TriangelL2"
					></path>
					{/*Балка надрессорная 1*/}
					<path
						style={{ fill: this.state.truck1Nadressornybeam1 ? '#DEEAD4' : 'red' }}
						d="M1188 1026H1836V1107H1188z"
						title="Балка надрессорная 1"
						id="truck1Nadressornybeam1"
					></path>
				</g>
			</g>
		);
	}
}