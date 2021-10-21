// ===============================================
//               Global variables
// ===============================================

// varialbles used for raw data,
// as they are fetched from the API
var mymap = null;
var gNBs  = null;
var cells = null;
var ues   = null;
var paths = null;


// variables used for painting / updating the map
//  map layer groups
var cells_lg         = L.layerGroup(),
    cell_coverage_lg = L.layerGroup(),
    ues_lg           = L.layerGroup(),
    paths_lg         = L.layerGroup();
//  markers
var ue_markers   = {};
var cell_markers = {};
var map_bounds   = [];
// helper var for correct initialization
var UEs_first_paint = true;

var UE_refresh_interval = null;

// template for UE buttons
var ue_btn_tpl = `<button class="btn btn-success px-4 btn-ue" type="button" id="btn-ue-{{id}}" data-supi={{supi}} data-running=false>{{name}}</button> `

var looping_UEs = 0;
// ===============================================




// ===============================================
//                 Document ready
// ===============================================
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
            // when ready,
            //  1. get and paint every path per UE
            //  2. create start/stop buttons
            for (const ue of ues) {
                api_get_specific_path(ue.path_id);
                ui_generate_loop_btn_for( ue );
                ui_set_loop_btn_status_for( ue );
            }
            if ( ues.length >0 ) {
                ui_add_ue_btn_listeners();
                ui_add_ue_all_btn_listener();
            }
            else {
                $('#btn-start-all').removeClass("btn-success").addClass("btn-secondary").attr("disabled",true);
            }
        }
      }, 100);
    };
    wait_for_UEs_data();


});

$( window ).resize(function() {
    $('#mapid').css({"height": window.innerHeight * 0.65} );
});
// ===============================================





// ===============================================
//         Interval - map refresh functions
// ===============================================
// 
// Initializes the "UE_refresh_interval"
// which triggers an Ajax call every second
// to fetch the UE data and update the map
function start_map_refresh_interval() {

    if (UE_refresh_interval == null) {
        // start updating every second
        UE_refresh_interval = setInterval(function(){ 
            api_get_UEs();
        }, 1000);
    }
}

function stop_map_refresh_interval() {
    // stop updating every second
    clearInterval( UE_refresh_interval );
    UE_refresh_interval = null;
}
// ===============================================







// ===============================================
//         initialize the Leaflet.js map 
// ===============================================
// 
// TODO: calculate the center of the map depending on
//       the cells positions.
// 
function ui_initialize_map() {

    // set map height
    $('#mapid').css({"height": window.innerHeight * 0.65} );

    var mbAttr = 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
                'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
        mbUrl = 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';

    var grayscale   = L.tileLayer(mbUrl, {id: 'mapbox/light-v9',    tileSize: 512, zoomOffset: -1, attribution: mbAttr, maxZoom: 23}),
        streets     = L.tileLayer(mbUrl, {id: 'mapbox/streets-v11', tileSize: 512, zoomOffset: -1, attribution: mbAttr, maxZoom: 23});


    // map initialization
    mymap = L.map('mapid', {
        layers: [grayscale, cells_lg, cell_coverage_lg, ues_lg, paths_lg]
    }).setView([48.499998, 23.383331], 5);    // Geographical midpoint of Europe
    //.setView([37.996349, 23.819861], 17);  // previous "hard-coded" center for the first map scenario at NCSRD


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






// Ajax request to get UEs data
// on success: paint the UE marks on the map
// 
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
            // console.log(data);
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


// 1. At first Ajax call, UE marks are generated and painted on the map
// 2. At later Ajax calls, the marks are just updated (coordinates and popup content)
// 
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
                .bindPopup("<b>"+ ue.name +"</b><br />"+
                           // ue.description +"<br />"+
                           "location: ["  + ue.latitude.toFixed(6) + "," + ue.longitude.toFixed(6) +"]<br />"+
                           "Cell ID: " + ue.cell_id_hex +"<br />"+
                           "External identifier: " + ue.external_identifier +"<br />"+
                           "Speed:"+ ue.speed)
                .addTo(ues_lg); // add to layer group

        }
        else {
            // move existing markers
            var newLatLng = [ue.latitude,ue.longitude];
            ue_markers[ue.supi].setLatLng(newLatLng);
            ue_markers[ue.supi].setPopupContent("<b>"+ ue.name +"</b><br />"+
                           // ue.description +"<br />"+
                           "location: ["  + ue.latitude.toFixed(6) + "," + ue.longitude.toFixed(6) +"]<br />"+
                           "Cell ID: " + ue.cell_id_hex +"<br />"+
                           "External identifier: " + ue.external_identifier +"<br />"+
                           "Speed:"+ ue.speed);
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
            // console.log(data);
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




// Ajax request to get Cells data
// on success: paint the Cell marks on the map
// 
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
        
        // keep (lat, long) to later set view of the map
        map_bounds.push([cell.latitude,cell.longitude]);
    }
    
    // if cells where found, map -> set view
    if ( cells.length >0 ) {
        var leaflet_bounds = new L.LatLngBounds(map_bounds);
        mymap.fitBounds( leaflet_bounds );
    }

}





// Ajax request to get specific Path data
// on success: paint the Path on the map
// 
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
            // console.log(data);
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



// Adds a path polyline to the map
// Calls a helper function "fix_points_format()"
// to prepare the data for leaflet.js format
// 
function ui_map_paint_path( data ) {

    var latlng   = fix_points_format( data.points );
    var polyline = L.polyline(latlng, {
        color: '#00a3cc',
        opacity: 0.2
    }).addTo(paths_lg).addTo(mymap);
}



// Helper function
// Takes the data fetched from the API
// and returns them with a format appropriate
// leaflet.js
// 
function fix_points_format( datapoints ) {

    // from (array of objects): [{latitude: 37.996095, longitude: 23.818562},{...}]
    // to   (array of arrays) : [[37.996095,23.818562],[...]

    var fixed = new Array(datapoints.length);
    
    for (i=0 ; i<datapoints.length ; i++) {
        fixed[i] = [datapoints[i].latitude , datapoints[i].longitude];
    }
    return fixed;
}





// Ajax request to START the loop for a UE
// on success: handle the state of the buttons
// 
function api_start_loop( ue ) {

    var url = app.api_url + '/utils/start-loop/';
    var data = {
        "supi": ue.supi
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
            // console.log(data);
            $("#btn-ue-"+ue.id).data("running",true);
            $("#btn-ue-"+ue.id).removeClass('btn-success').addClass('btn-danger');
            looping_UEs++;
            if (looping_UEs == ues.length) {
                $('#btn-start-all').removeClass('btn-success').addClass('btn-danger');
                $('#btn-start-all').text("Stop all");
            }
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



// Ajax request to STOP the loop for a UE
// on success: handle the state of the buttons
// and check whether the interval/updating-the-map has to stop
// 
function api_stop_loop( ue ) {

    var url = app.api_url + '/utils/stop-loop/';
    var data = {
        "supi": ue.supi
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
            // console.log(data);
            $("#btn-ue-"+ue.id).data("running",false);
            $("#btn-ue-"+ue.id).addClass('btn-success').removeClass('btn-danger');
            looping_UEs--;
            if (looping_UEs == 0) {
                $('#btn-start-all').addClass('btn-success').removeClass('btn-danger');
                $('#btn-start-all').text("Start all");
                stop_map_refresh_interval();
            }
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





// Add start/stop loop button for UE
// It generates HTML based on the button template
// and adds it to the ue-btn-area
// 
function ui_generate_loop_btn_for( ue ) {
    var html_str = ue_btn_tpl.replaceAll("{{id}}", ue.id).replace("{{name}}",ue.name).replace("{{supi}}",ue.supi);
    $(".ue-btn-area").append(html_str);
}





// Add start/stop loop button for UE
// It generates HTML based on the button template
// and adds it to the ue-btn-area
// 
function ui_set_loop_btn_status_for(ue) {
    var url = app.api_url + '/utils/state-loop/' + ue.supi;

    $.ajax({
        type: 'GET',
        url:  url,
        contentType : 'application/json',
        headers: {
            "authorization": "Bearer " + app.auth_obj.access_token
        },
        // data:         JSON.stringify(data),
        processData:  false,
        beforeSend: function() {
            // 
        },
        success: function(data)
        {
            // console.log(data);
            if ( data.running ) {
                $('#btn-ue-'+ue.id).removeClass('btn-success').addClass('btn-danger');
                $('#btn-ue-'+ue.id).data("running",data.running);
                
                start_map_refresh_interval();
            }
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




// Adds a listener to every start/stop loop UE button
// 
function ui_add_ue_btn_listeners(){
    $('.btn-ue').on('click', function(){

        curr_supi = $(this).data("supi");
        
        if ( $(this).data("running") == false) {
            
            // start location UE loop
            api_start_loop({"supi":curr_supi});
            start_map_refresh_interval();

            $(this).data("running",true);
            $(this).removeClass('btn-success').addClass('btn-danger');
        } else {

            // stop location UE loop
            api_stop_loop({"supi":curr_supi});

            $(this).data("running",false);
            $(this).addClass('btn-success').removeClass('btn-danger');
        }
    });
}




// Adds a listener start/stop ALL button
// 
function ui_add_ue_all_btn_listener() {
    $('#btn-start-all').on('click', function(){
        $(this).toggleClass('btn-success').toggleClass('btn-danger');
        if ( $(this).text() == "Start all" ) {
            
            // start location UE loops
            for (const ue of ues) {
                api_start_loop(ue);
            }

            start_map_refresh_interval();

            $(this).text("Stop all");
        } else {

            // stop location UE loops
            for (const ue of ues) {
                api_stop_loop(ue);
            }

            stop_map_refresh_interval();

            $(this).text("Start all");
        }
    });
}