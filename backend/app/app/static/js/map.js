// varialbles used for raw data,
// as they are fetched from the API
var mymap = null;
var gNBs  = null;
var cells = null;
var ues   = null;
var paths = null;


// variables used for painting / updating the map
// > layer groups
var cells_lg         = L.layerGroup(),
    cell_coverage_lg = L.layerGroup(),
    ues_lg           = L.layerGroup(),
    paths_lg         = L.layerGroup();
// > markers
var ue_markers   = {};
var cell_markers = {};
// helper var for correct initialization
var UEs_first_paint = true;

var UE_refresh_interval = null;



$( document ).ready(function() {

    ui_initialize_map();

    // get UEs & Cells data and paint map
    api_get_UEs();
    api_get_Cells();


    // wait for ajax call to UEs endpoint
    // to initialize the UEs data
    let wait_for_UEs_data = function() {
      setTimeout(function () {
        if (ues === null)
          wait_for_UEs_data();
        else {
            // get and paint every path per UE
            for (const ue of ues) {
                api_get_specific_path(ue.path_id);
            }
        }
      }, 500);
    };
    wait_for_UEs_data();


    // TODO:
    // replace with a switch / toggle button...
    $('#btn-start').on('click', function(){
        $(this).toggleClass('btn-success').toggleClass('btn-danger');
        if ( $(this).text() == "Start" ) {
            
            // start location UE loops
            for (const ue of ues) {
                api_start_loop(ue.supi);
            }

            // start updating every second
            UE_refresh_interval = setInterval(function(){ 
                api_get_UEs();
            }, 1000);



            $(this).text("Stop");
        } else {

            // stop location UE loops
            for (const ue of ues) {
                api_stop_loop(ue.supi);
            }

            // stop updating every second
            clearInterval( UE_refresh_interval );

            $(this).text("Start");
        }
    });
    

});



function ui_initialize_map() {
    var mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox/light-v9', tileSize: 512, zoomOffset: -1, attribution: mbAttr, maxZoom: 23}),
        streets     = L.tileLayer(mbUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mbAttr, maxZoom: 23});


    // map initialization
    mymap = L.map('mapid', {
        layers: [grayscale, cells_lg, cell_coverage_lg, ues_lg, paths_lg]
    }).setView([37.996349, 23.819861], 17);

    var baseLayers = {
            "Grayscale": grayscale,
            "Streets": streets
        };

    var overlays = {
        "cells": cells_lg,
        "cell coverage": cell_coverage_lg,
        "UEs": ues_lg,
        "paths": paths_lg
    };

    L.control.layers(baseLayers, overlays).addTo(mymap);
}







function api_get_UEs() {
    
    var url = app.api_url + '/UEs/?skip=0&limit=100';

    $.ajax({
        type: 'GET',
        url:  url,
        contentType : 'application/json',
        headers: {
            "authorization": "Bearer " + app.auth_obj.access_token
        },
        processData:  false,
        beforeSend: function() {
            // 
        },
        success: function(data)
        {
            console.log(data);
            ues = data;
            ui_map_paint_UEs();
        },
        error: function(err)
        {
            console.log(err);
        },
        complete: function()
        {
            // 
        },
        timeout: 5000
    });
}



function ui_map_paint_UEs() {

    for (const ue of ues) {
        if (UEs_first_paint) { 
            // create markers - this will be executed only once!
            var walk_icon = L.divIcon({
                className: 'emu-pin-box',
                iconSize: L.point(30,42),
                iconAnchor: L.point(15,42),
                popupAnchor: L.point(0,-38),
                tooltipAnchor: L.point(0,0),
                html: '<div class="pin-bg pin-bg-walk"></div>\
                       <div class="pin-icon ion-md-walk"></div>'
            });
            
            ue_markers[ue.supi] = L.marker([ue.latitude,ue.longitude], {icon: walk_icon}).addTo(mymap)
                .bindTooltip(ue.ip_address_v4)
                .bindPopup("<b>"+ ue.name +"</b><br />"+ ue.description +"<br />Speed:"+ ue.speed)
                .addTo(ues_lg); // add to layer group

        }
        else {
            // move existing markers
            var newLatLng = [ue.latitude,ue.longitude];
            ue_markers[ue.supi].setLatLng(newLatLng);
        }
    }
    UEs_first_paint = false;   
}





function api_get_Cells() {
    
    var url = app.api_url + '/Cells/?skip=0&limit=100';

    $.ajax({
        type: 'GET',
        url:  url,
        contentType : 'application/json',
        headers: {
            "authorization": "Bearer " + app.auth_obj.access_token
        },
        processData:  false,
        beforeSend: function() {
            // 
        },
        success: function(data)
        {
            console.log(data);
            cells = data;
            ui_map_paint_Cells();
        },
        error: function(err)
        {
            console.log(err);
        },
        complete: function()
        {
            // 
        },
        timeout: 5000
    });
}


function ui_map_paint_Cells() {

    for (const cell of cells) {
        // create markers
        var cell_icon_5g = L.divIcon({
            className: 'emu-pin-box',
            iconSize: L.point(30,42),
            iconAnchor: L.point(15,42),
            popupAnchor: L.point(0,-38),
            tooltipAnchor: L.point(0,0),
            html: '<div class="pin-bg pin-bg-red"></div>\
                   <div class="pin-icon icon ion-md-cellular"></div>\
                   <div class="pin-text">5G</div>',
        });
        
        cell_markers[cell.cell_id] = L.marker([cell.latitude,cell.longitude], {icon: cell_icon_5g}).addTo(mymap)
            .bindTooltip(cell.cell_id)
            .bindPopup("<b>"+ cell.name +"</b><br />"+ cell.description)
            .addTo(cells_lg); // add to layer group        
        
        L.circle([cell.latitude,cell.longitude], cell.radius, {
            color: 'none',
            fillColor: '#f03',
            fillOpacity: 0.05
        }).addTo(cell_coverage_lg).addTo(mymap);
          
    }    
}






function api_get_specific_path( id ) {
    
    var url = app.api_url + '/frontend/location/' + id;

    $.ajax({
        type: 'GET',
        url:  url,
        contentType : 'application/json',
        headers: {
            "authorization": "Bearer " + app.auth_obj.access_token
        },
        processData:  false,
        beforeSend: function() {
            // 
        },
        success: function(data)
        {
            console.log(data);
            // paths = data;
            ui_map_paint_path(data);
        },
        error: function(err)
        {
            console.log(err);
        },
        complete: function()
        {
            // 
        },
        timeout: 5000
    });
}


function ui_map_paint_path( data ) {

    var latlng   = fix_points_format( data.points );
    var polyline = L.polyline(latlng, {
        color: '#00a3cc',
        opacity: 0.2
    }).addTo(paths_lg).addTo(mymap);
}



function fix_points_format( datapoints ) {

    // from (array of objects): [{latitude: 37.996095, longitude: 23.818562},{...}]
    // to   (array of arrays) : [[37.996095,23.818562],[...]

    var fixed = new Array(datapoints.length);
    
    for (i=0 ; i<datapoints.length ; i++) {
        fixed[i] = [datapoints[i].latitude , datapoints[i].longitude];
    }
    return fixed;
}




function api_start_loop( supi ) {

    var url = app.api_url + '/utils/start-loop';
    var data = {
        "supi": supi
    };

    $.ajax({
        type: 'POST',
        url:  url,
        contentType : 'application/json',
        headers: {
            "authorization": "Bearer " + app.auth_obj.access_token
        },
        data:         JSON.stringify(data),
        processData:  false,
        beforeSend: function() {
            // 
        },
        success: function(data)
        {
            console.log(data);
        },
        error: function(err)
        {
            console.log(err);
        },
        complete: function()
        {
            // 
        },
        timeout: 5000
    });
}



function api_stop_loop( supi ) {

    var url = app.api_url + '/utils/stop-loop';
    var data = {
        "supi": supi
    };

    $.ajax({
        type: 'POST',
        url:  url,
        contentType : 'application/json',
        headers: {
            "authorization": "Bearer " + app.auth_obj.access_token
        },
        data:         JSON.stringify(data),
        processData:  false,
        beforeSend: function() {
            // 
        },
        success: function(data)
        {
            console.log(data);
        },
        error: function(err)
        {
            console.log(err);
        },
        complete: function()
        {
            // 
        },
        timeout: 5000
    });
}
    // // walking-UE (around the library)

    // var walk_icon = L.divIcon({
    //     className: 'emu-pin-box',
    //     iconSize: L.point(30,42),
    //     iconAnchor: L.point(15,42),
    //     popupAnchor: L.point(0,-38),
    //     tooltipAnchor: L.point(0,0),
    //     html: '<div class="pin-bg pin-bg-walk"></div>\
    //            <div class="pin-icon ion-md-walk"></div>'
    // });
    // var marker = L.marker([37.998119,23.819444], {icon: walk_icon}).addTo(mymap)
    //     .bindTooltip("10.2.0.1")
    //     .bindPopup("<b>Walking UE: 1</b><br />Around the Library...<br />Speed: 1m/sec")
    //     .addTo(walking_UEs);


    // var latlngs = [            
    //     [37.998119,23.819444],[37.998125,23.819436],[37.998132,23.819428],[37.998138,23.819420],[37.998144,23.819412],[37.998151,23.819404],[37.998157,23.819396],[37.998164,23.819388],[37.998170,23.819380],[37.998176,23.819372],[37.998183,23.819364],[37.998189,23.819356],[37.998195,23.819348],[37.998202,23.819340],[37.998208,23.819332],[37.998215,23.819324],[37.998221,23.819316],[37.998227,23.819308],[37.998234,23.819300],[37.998240,23.819291],[37.998247,23.819283],[37.998253,23.819275],[37.998259,23.819267],[37.998266,23.819259],[37.998272,23.819251],[37.998278,23.819243],[37.998285,23.819235],[37.998283,23.819222],[37.998276,23.819214],[37.998269,23.819206],[37.998263,23.819198],[37.998256,23.819191],[37.998250,23.819183],[37.998243,23.819175],[37.998237,23.819167],[37.998230,23.819159],[37.998224,23.819151],[37.998217,23.819143],[37.998211,23.819136],[37.998204,23.819128],[37.998198,23.819120],[37.998191,23.819112],[37.998185,23.819104],[37.998178,23.819096],[37.998171,23.819089],[37.998165,23.819081],[37.998158,23.819073],[37.998152,23.819065],[37.998145,23.819057],[37.998139,23.819049],[37.998132,23.819042],[37.998126,23.819034],[37.998119,23.819026],[37.998113,23.819018],[37.998106,23.819010],[37.998100,23.819002],[37.998093,23.818994],[37.998087,23.818987],[37.998080,23.818979],[37.998073,23.818971],[37.998067,23.818963],[37.998060,23.818955],[37.998054,23.818947],[37.998047,23.818940],[37.998041,23.818932],[37.998034,23.818924],[37.998028,23.818916],[37.998019,23.818921],[37.998012,23.818929],[37.998006,23.818937],[37.998000,23.818945],[37.997994,23.818954],[37.997987,23.818962],[37.997981,23.818970],[37.997975,23.818978],[37.997969,23.818986],[37.997962,23.818995],[37.997956,23.819003],[37.997950,23.819011],[37.997944,23.819019],[37.997937,23.819027],[37.997931,23.819036],[37.997925,23.819044],[37.997919,23.819052],[37.997912,23.819060],[37.997906,23.819068],[37.997900,23.819077],[37.997894,23.819085],[37.997887,23.819093],[37.997881,23.819101],[37.997875,23.819109],[37.997869,23.819118],[37.997862,23.819126],[37.997856,23.819134],[37.997862,23.819143],[37.997868,23.819151],[37.997874,23.819159],[37.997881,23.819167],[37.997887,23.819175],[37.997894,23.819183],[37.997900,23.819191],[37.997906,23.819199],[37.997913,23.819207],[37.997919,23.819215],[37.997926,23.819223],[37.997932,23.819231],[37.997938,23.819239],[37.997945,23.819247],[37.997951,23.819255],[37.997958,23.819263],[37.997964,23.819272],[37.997970,23.819280],[37.997977,23.819288],[37.997983,23.819296],[37.997990,23.819304],[37.997996,23.819312],[37.998002,23.819320],[37.998009,23.819328],[37.998015,23.819336],[37.998022,23.819344],[37.998028,23.819352],[37.998034,23.819360],[37.998041,23.819368],[37.998047,23.819376],[37.998054,23.819384],[37.998060,23.819392],[37.998066,23.819400],[37.998073,23.819408],[37.998079,23.819416],[37.998086,23.819424],[37.998092,23.819432],[37.998098,23.819440]
    // ];

    // var polyline = L.polyline(latlngs, {
    //     color: '#00a3cc',
    //     opacity: 0.2
    // }).addTo(routes).addTo(mymap);


    // setInterval(function(){ 
        
    //     var url = app.api_url + '/UEs/202010000000001';

    //     $.ajax({
    //         type: 'GET',
    //         url:  url,
    //         contentType : 'application/json',
    //         headers: {
    //             "authorization": "Bearer " + app.auth_obj.access_token
    //         },
    //         processData:  false,
    //         success: function(data)
    //         {
    //             // console.log(data);
    //             var newLatLng = new L.LatLng(data.latitude,data.longitude);
    //             marker.setLatLng(newLatLng);
    //         },
    //         error: function(err)
    //         {
    //             // console.log(err);
    //         },
    //         timeout: 5000
    //     });
    // }, 1000);




    // var walk_icon2 = L.divIcon({
    //     className: 'emu-pin-box',
    //     iconSize: L.point(30,42),
    //     iconAnchor: L.point(15,42),
    //     popupAnchor: L.point(0,-38),
    //     tooltipAnchor: L.point(0,0),
    //     html: '<div class="pin-bg pin-bg-walk"></div>\
    //            <div class="pin-icon ion-md-walk"></div>'
    // });
    // var marker2 = L.marker([37.999262,23.819251], {icon: walk_icon2}).addTo(mymap)
    //     .bindTooltip("10.2.0.2")
    //     .bindPopup("<b>Walking UE: 2</b><br />Goes around central offices...<br />Speed: 1m/sec")
    //     .addTo(walking_UEs);


    // var latlngs2 = [            
    //     [37.999262,23.819251],[37.999257,23.819260],[37.999252,23.819269],[37.999246,23.819279],[37.999241,23.819288],[37.999236,23.819297],[37.999230,23.819306],[37.999225,23.819315],[37.999213,23.819317],[37.999205,23.819312],[37.999197,23.819307],[37.999189,23.819302],[37.999181,23.819297],[37.999173,23.819292],[37.999165,23.819287],[37.999156,23.819282],[37.999148,23.819277],[37.999140,23.819272],[37.999132,23.819267],[37.999124,23.819262],[37.999116,23.819257],[37.999108,23.819252],[37.999100,23.819247],[37.999092,23.819242],[37.999084,23.819237],[37.999076,23.819232],[37.999068,23.819227],[37.999059,23.819222],[37.999051,23.819217],[37.999043,23.819212],[37.999035,23.819207],[37.999027,23.819202],[37.999019,23.819197],[37.999011,23.819192],[37.999003,23.819187],[37.998995,23.819182],[37.998987,23.819177],[37.998978,23.819185],[37.998974,23.819195],[37.998969,23.819205],[37.998965,23.819215],[37.998961,23.819225],[37.998957,23.819235],[37.998952,23.819245],[37.998948,23.819255],[37.998944,23.819265],[37.998939,23.819275],[37.998935,23.819285],[37.998931,23.819295],[37.998927,23.819305],[37.998922,23.819315],[37.998918,23.819325],[37.998914,23.819335],[37.998910,23.819345],[37.998905,23.819355],[37.998901,23.819365],[37.998892,23.819363],[37.998884,23.819358],[37.998876,23.819353],[37.998867,23.819348],[37.998859,23.819343],[37.998851,23.819338],[37.998843,23.819334],[37.998835,23.819329],[37.998827,23.819324],[37.998819,23.819319],[37.998811,23.819314],[37.998802,23.819309],[37.998794,23.819304],[37.998786,23.819299],[37.998778,23.819294],[37.998770,23.819289],[37.998762,23.819284],[37.998754,23.819280],[37.998746,23.819275],[37.998738,23.819270],[37.998729,23.819265],[37.998721,23.819260],[37.998713,23.819255],[37.998705,23.819250],[37.998697,23.819245],[37.998689,23.819240],[37.998681,23.819235],[37.998673,23.819231],[37.998664,23.819226],[37.998656,23.819221],[37.998648,23.819216],[37.998640,23.819211],[37.998637,23.819197],[37.998641,23.819186],[37.998645,23.819176],[37.998649,23.819166],[37.998653,23.819155],[37.998657,23.819145],[37.998661,23.819135],[37.998665,23.819125],[37.998668,23.819114],[37.998672,23.819104],[37.998676,23.819094],[37.998680,23.819083],[37.998684,23.819073],[37.998688,23.819063],[37.998692,23.819052],[37.998695,23.819042],[37.998699,23.819032],[37.998703,23.819021],[37.998707,23.819011],[37.998711,23.819001],[37.998715,23.818991],[37.998719,23.818980],[37.998723,23.818970],[37.998726,23.818960],[37.998730,23.818949],[37.998734,23.818939],[37.998738,23.818929],[37.998742,23.818918],[37.998746,23.818908],[37.998750,23.818898],[37.998753,23.818888],[37.998757,23.818877],[37.998761,23.818867],[37.998765,23.818857],[37.998769,23.818846],[37.998773,23.818836],[37.998777,23.818826],[37.998781,23.818815],[37.998784,23.818805],[37.998788,23.818795],[37.998792,23.818784],[37.998796,23.818774],[37.998800,23.818764],[37.998804,23.818754],[37.998808,23.818743],[37.998811,23.818733],[37.998815,23.818723],[37.998819,23.818712],[37.998823,23.818702],[37.998827,23.818692],[37.998831,23.818681],[37.998835,23.818671],[37.998839,23.818661],[37.998842,23.818651],[37.998846,23.818640],[37.998850,23.818630],[37.998854,23.818620],[37.998858,23.818609],[37.998862,23.818599],[37.998866,23.818589],[37.998874,23.818593],[37.998882,23.818599],[37.998890,23.818604],[37.998897,23.818610],[37.998905,23.818615],[37.998913,23.818621],[37.998921,23.818626],[37.998929,23.818632],[37.998937,23.818638],[37.998945,23.818643],[37.998952,23.818649],[37.998960,23.818654],[37.998968,23.818660],[37.998976,23.818665],[37.998984,23.818671],[37.998992,23.818677],[37.998999,23.818682],[37.999007,23.818688],[37.999015,23.818693],[37.999023,23.818699],[37.999031,23.818705],[37.999039,23.818710],[37.999047,23.818716],[37.999054,23.818721],[37.999062,23.818727],[37.999070,23.818732],[37.999078,23.818738],[37.999086,23.818744],[37.999094,23.818749],[37.999101,23.818755],[37.999109,23.818760],[37.999117,23.818766],[37.999125,23.818771],[37.999133,23.818777],[37.999141,23.818783],[37.999149,23.818788],[37.999156,23.818794],[37.999164,23.818799],[37.999172,23.818805],[37.999180,23.818811],[37.999188,23.818816],[37.999196,23.818822],[37.999203,23.818827],[37.999211,23.818833],[37.999219,23.818838],[37.999227,23.818844],[37.999235,23.818850],[37.999243,23.818855],[37.999250,23.818861],[37.999258,23.818866],[37.999266,23.818872],[37.999274,23.818877],[37.999282,23.818883],[37.999290,23.818889],[37.999298,23.818894],[37.999299,23.818909],[37.999295,23.818919],[37.999291,23.818929],[37.999287,23.818939],[37.999283,23.818949],[37.999279,23.818959],[37.999275,23.818969],[37.999271,23.818980],[37.999266,23.818990],[37.999262,23.819000],[37.999258,23.819010],[37.999254,23.819020],[37.999250,23.819030],[37.999246,23.819040],[37.999242,23.819051],[37.999238,23.819061],[37.999233,23.819071],[37.999229,23.819081],[37.999225,23.819091],[37.999221,23.819101],[37.999217,23.819111],[37.999213,23.819122],[37.999209,23.819132],[37.999214,23.819143],[37.999222,23.819148],[37.999230,23.819154],[37.999238,23.819159],[37.999246,23.819165],[37.999253,23.819171],[37.999261,23.819176],[37.999269,23.819182],[37.999277,23.819187],[37.999277,23.819199],[37.999276,23.819211],[37.999274,23.819222]
    // ];

    // var polyline2 = L.polyline(latlngs2, {
    //     color: '#00a3cc',
    //     opacity: 0.2
    // }).addTo(routes).addTo(mymap);



    // setInterval(function(){ 
        
    //     var url = app.api_url + '/UEs/202010000000011';

    //     $.ajax({
    //         type: 'GET',
    //         url:  url,
    //         contentType : 'application/json',
    //         headers: {
    //             "authorization": "Bearer " + app.auth_obj.access_token
    //         },
    //         processData:  false,
    //         success: function(data)
    //         {
    //             // console.log(data);
    //             var newLatLng = new L.LatLng(data.latitude,data.longitude);
    //             marker2.setLatLng(newLatLng);
    //         },
    //         error: function(err)
    //         {
    //             // console.log(err);
    //         },
    //         timeout: 5000
    //     });
    // }, 1000);