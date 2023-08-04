$(function () {
    new Chart(document.getElementById("player_bar_chart").getContext("2d"), getChartJs("player"));
    new Chart(document.getElementById("host_bar_chart").getContext("2d"), getChartJs("host"));
    new Chart(document.getElementById("company_bar_chart").getContext("2d"), getChartJs("company"));
});
var aspectRatio = (document.body.offsetWidth < 768) ? false : true;
function getChartJs(userType) { 
    var config 			= 	null;
    var monthsArray 	=   getPreviousMonths();

	$.each(userRecords, function(index,html){
		for(var i=0; i < monthsArray.length; i++) {
			if(typeof html[monthsArray[i]['month_year']] !== typeof undefined){
				monthsArray[i]['total_player'] 	= (html[monthsArray[i]['month_year']]['total_player']) ? html[monthsArray[i]['month_year']]['total_player'] : 0;
				monthsArray[i]['total_host'] 		= (html[monthsArray[i]['month_year']]['total_host']) ? html[monthsArray[i]['month_year']]['total_host'] : 0;
				monthsArray[i]['total_company'] 	= (html[monthsArray[i]['month_year']]['total_company']) ? html[monthsArray[i]['month_year']]['total_company'] : 0;
			}
		}
	});

	var months		= [];
	var playerCount 	= [];
	var hostCount = [];
	var companyCount = [];


	for(var i=0; i < monthsArray.length; i++) {
		months.push(monthsArray[i]['name']);
		
		if(typeof monthsArray[i]['total_player'] !== typeof undefined){
			playerCount.push(monthsArray[i]['total_player']);
		}else{
			playerCount.push(0);
		}

		if(typeof monthsArray[i]['total_host'] !== typeof undefined){
			hostCount.push(monthsArray[i]['total_host']);
		}else{
			hostCount.push(0);
		}

		if(typeof monthsArray[i]['total_company'] !== typeof undefined){
			companyCount.push(monthsArray[i]['total_company']);
		}else{
			companyCount.push(0);
		}
	}


	let dataSets = [];
	if(userType == "player"){
		dataSets.push({
			label: "Player",
			data: playerCount.reverse(),
			backgroundColor: 'rgba(63, 81, 181, 0.9)'
		});
	} else if(userType == "host"){
		dataSets.push({
			label: "Host",
			data: hostCount.reverse(),
			backgroundColor: 'rgba(76, 175, 80, 1)'
		});
	}else if(userType == "company"){
		dataSets.push({
			label: "Company",
			data: companyCount.reverse(),
			backgroundColor: 'rgba(255, 152, 0, 1)'
		});
	}


	config = {
		type: 'bar',
		data: {
			labels: months.reverse(),
			datasets: dataSets
		},
		options: {
			maintainAspectRatio: aspectRatio,
			responsive: true,
			legend: {
				display		:	false,
				fullWidth	: 	true,
				position 	:	"top",
				labels		: 	{
					fontColor: 'rgb(255, 99, 132)'
				}
			},
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						userCallback: function(label, index, labels) {
							if (Math.floor(label) === label) {
								return label;
							}
						},
					}
				}],
			}
		},

	};
    return config;
}

function getPreviousMonths(){
    var theMonths = new Array("01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12");
    var theMonthNames = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
    var today = new Date();

    var aMonth 	= today.getMonth();
    var aYear 	= today.getFullYear();

    var i;
    var monthList = new Array();

    for (i=0; i<12; i++) {
        monthList[i] 				=	{};
        monthList[i]['month_year'] 	=  	theMonths[aMonth]+'-'+aYear;
        monthList[i]['name'] 		=	theMonthNames[aMonth]+' '+aYear;
        aMonth--;
        if (aMonth < 0) {
            aMonth = 11;
            aYear--;
        }
    }
    return monthList;
}
