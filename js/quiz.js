var divider = "||";
var URI = 'http://' + window.location.hostname + window.location.pathname;
var debugging = true;

/** FROM https://www.kevinleary.net/javascript-get-url-parameters/
 * JavaScript Get URL Parameter
 * 
 * @param String prop The specific URL parameter you want to retreive the value for
 * @return String|Object If prop is provided a string value is returned, otherwise an object of all properties is returned
 */
function getUrlParams( prop ) {
    var params = {};
    var search = decodeURIComponent( window.location.href.slice( window.location.href.indexOf( '?' ) + 1 ) );
    var definitions = search.split( '&' );

    definitions.forEach( function( val, key ) {
        var parts = val.split( '=', 2 );
        params[ parts[ 0 ] ] = parts[ 1 ];
    } );

    return ( prop && prop in params ) ? params[ prop ] : params;
}

function has_next_question() {
    return !(getUrlParams()['q']==sessionStorage.getItem("numQuestions")-1);
}

function next_question() {
    if (has_next_question()) {
        window.location = (location.protocol + '//' + location.host + location.pathname + '?id=' + getUrlParams('id') + "&q=" + (getUrlParams()['q']==undefined?'1':(parseInt(getUrlParams()['q'])+1)));
    }
}

function get_button(caption, is_correct, div_id, disabled=false) {
    var retval = '<button type="button" style="margin: 5px;" onclick="update_score(' + is_correct + ', \'' + div_id + '\')" class="btn btn-primary" ' + (disabled?"disabled":"") + '>' + caption + '</button>';
    return retval;
}

function update_score(is_correct, div_id) {
    if (is_correct) {
        $('#' + div_id).addClass('bg-success text-white');
        if (!has_next_question())
            alert('End of game!');
    }
    else {
        $('#' + div_id).addClass('bg-danger text-white');
    }
    if (sessionStorage.getItem("question" + (getUrlParams()['q']==undefined?'0':(parseInt(getUrlParams()['q']))) + "_status")==0) 
        sessionStorage.setItem("question" + (getUrlParams()['q']==undefined?'0':(parseInt(getUrlParams()['q']))) + "_status", (is_correct?"1":"2"));
    rebuild_status_breadcrumps(is_correct);      
}

function rebuild_status_breadcrumps(is_correct=false) {
    $('#alx_status').html('');
    if (is_correct && !has_next_question() && (get_value_from_metadata_local_storage("allow_reset")=="true") )
        $('#alx_status').html($('#alx_status').html() + '<li class="page-item"><img onclick="reset_quiz()" src="img/arrow_reload.png"></li>');
    var num_correct=0;
    var num_answered=0;
    for (var i=0; i<sessionStorage.getItem('numQuestions'); i++) {
        var bg_color='';
        if (sessionStorage.getItem("question" + i + "_status")=="1") {
            bg_color='bg-success';
            num_correct++;
        }
        if (sessionStorage.getItem("question" + i + "_status")=="2")
            bg_color='bg-danger';
        if (sessionStorage.getItem("question" + i + "_status")!="0")
            num_answered++;
        $('#alx_status').html($('#alx_status').html() + '<li class="page-item"><a class="page-link ' + bg_color + '" >' + (i+1) + '</a></li>');
    }
    if (is_correct && has_next_question())
        $('#alx_status').html($('#alx_status').html() + '<li class="page-item"><img onclick="next_question()" src="img/arrow_next.png"></li>');
    
    $('#alx_line_score').html((num_answered!=0?(Math.floor((num_correct*100)/num_answered) + " %"):("0%")));
}

function get_question_from_local_storage(question, data_label) {
    var selection=0;
    switch (data_label) {
        case 'question':
            selection=0;
            break;
        case 'image':
            selection=1;
            break;
        case 'option0':
            selection=2;
            break;
        case 'option1':
            selection=3;
            break;
        case 'option2':
            selection=4;
            break;
        case 'option3':
            selection=5;
            break;
        case 'correct':
            selection=6;
            break;
        case 'hint':
            selection=7;
            break;
        default:
            selection=0;
            break;
    }
    var chunks = question.split(divider);
    return chunks[selection];
}

function get_value_from_metadata_local_storage(data_label) {
    var selection=0;
    switch (data_label) {
        case 'id':
            selection=0;
            break;
        case 'class':
            selection=1;
            break;
        case 'description':
            selection=2;
            break;
        case 'shuffle_questions':
            selection=3;
            break;
        case 'send_score':
            selection=4;
            break;
        case 'allow_reset':
            selection=5;
            break;
        default:
            selection=0;
            break;
    }
    return sessionStorage.getItem('metadata').split(divider)[selection];
}

function reset_quiz() {
    for (var i=0; i<sessionStorage.getItem('numQuestions'); i++)
        sessionStorage.setItem("question" + i + "_status", 0);
    window.location = (location.protocol + '//' + location.host + location.pathname + '?id=' + getUrlParams('id') + "&q=0");
    
}

function clean_session_storage() {
    for (var i=0; i<sessionStorage.getItem('numQuestions'); i++) {
        sessionStorage.removeItem("question" + i + "_status");
        sessionStorage.removeItem("question" + i);
    }
    sessionStorage.removeItem("metadata");
    sessionStorage.removeItem("numQuestions");
}


function get_data_from_server(){
    if (getUrlParams('id')==undefined) {
        if (debugging)
            console.log("TODO - Δεν υπάρχει τεστ με αυτό το id - Να τερματιστεί η εφαρμογή");
    }
    $.ajaxSetup({
        async: false
    });
    var jqxhr = $.getJSON("quizes/" + getUrlParams('id') + ".json", function(data) {
        if (debugging)
            console.log("Η φόρτωση του json από τον server ολοκληρώθηκε με επιτυχία");
            parse_quiz(data);
    })
    .fail(function() {
        if (debugging) {
            console.log( "Αδυναμία φόρτωσης του json αρχείου από τον server" );
            console.log(jqxhr);
        }
    });
    
    function parse_quiz(data) {
        var read_type="question"; // Διαβάζει ερώτηση του quiz
        var read_type="metadata"; // Διαβάζει metadata του quiz
        var read_type="0";
        var question = '';
        var question_count=0;
        var metadata = '';
    
        $.each(data, function(index, value) {
            read_type = "0"; // Πριν αρχίσει το διάβασμα το ρυθμίζω σε μηδέν
            question = '';
            $.each(value, function(key, valu) {
                if (read_type=="0") {
                    if (key=="id") {
                        read_type="metadata";
                    } else {
                        read_type="question";
                    }   
                }
                if (read_type=="question") {
                    if (question=='')
                        question = valu;
                    else    
                        question = question + divider + valu;
                } else {
                    if (metadata=='')
                        metadata=valu;
                    else
                        metadata = metadata + divider + valu;
                }
            });
            if (read_type=="question") {
                sessionStorage.setItem("question" + question_count, question);
                /*
                    status=0 --> not answered yet
                    status=1 --> correct answer
                    status=2 --> wrong answer
                */
                sessionStorage.setItem("question" + question_count + "_status", 0);
                question_count+=1; 
            } else
                sessionStorage.setItem("metadata", metadata);
        });
        sessionStorage.setItem("numQuestions", question_count);
    }   
}

$( document ).ready(function() {
    if (!('id' in getUrlParams())) {
        if (debugging)
            console.log("TODO Δεν ορίστηκε το id του quiz - Πρέπει να τερματιστεί η εφαρμογή");
        return;
    }
    if (sessionStorage.getItem('metadata')==null) {
        if (debugging)
            console.log("Δεν έγινε φόρτωση των metadata στην sessionStorage. Επαναφόρτωση του quiz από τον server");
        get_data_from_server();
    }
    if (get_value_from_metadata_local_storage('id')!=getUrlParams('id')) {
        if (debugging)
            console.log("Έγινε αλλαγή τεστ - Φόρτωση νέου και διαγραφή της session storage");
        clean_session_storage();
        get_data_from_server();
        
    }
    if (sessionStorage.getItem('numQuestions')==null) {
        if (debugging)
            console.log("Δεν έχει οριστεί ο αριθμός των ερωτήσεων - Επαναφόρτωση του quiz από τον server");
        clean_session_storage();
        get_data_from_server();
    }

    q_num=0;
    if ('q' in getUrlParams())
        q_num = getUrlParams('q');
    if (debugging) {
        console.log('Αριθμός ερώτησης: ' + q_num);
        console.log(getUrlParams('q'));
    }
    
    if (q_num>=0 && q_num<sessionStorage.getItem('numQuestions')) {  
            rebuild_status_breadcrumps();            
            var current_question = sessionStorage.getItem("question" + q_num);
            $('#alx_line_msg').html(get_value_from_metadata_local_storage("description"));
            var img_url = 'quizes/' + getUrlParams()['id'] + '/' + get_question_from_local_storage(current_question, "image");
            $('#alx_line0_img').html('<a href="' + img_url + '" data-lightbox="image-1" data-title="' + get_question_from_local_storage(current_question, 'question') + '"><img src="' + img_url + '" class="img-fluid" style="max-height: 200px;">');
            if (sessionStorage.getItem("question" + q_num + "_status")==0)
            {
                $('#alx_line0_question').html(get_question_from_local_storage(current_question, 'question'));
                //$('#alx_line0_img').html(get_question_from_local_storage(current_question, 'image'));
                $('#alx_line1_option0').html(get_button("A", get_question_from_local_storage(current_question, 'correct')=='option0', "alx_line1_option0") + get_question_from_local_storage(current_question, 'option0'));
                $('#alx_line1_option1').html(get_button("Β", get_question_from_local_storage(current_question, 'correct')=='option1', "alx_line1_option1") + get_question_from_local_storage(current_question, 'option1'));
                $('#alx_line3_option2').html(get_button("Γ", get_question_from_local_storage(current_question, 'correct')=='option2', "alx_line3_option2") + get_question_from_local_storage(current_question, 'option2'));
                $('#alx_line3_option3').html(get_button("Δ", get_question_from_local_storage(current_question, 'correct')=='option3', "alx_line3_option3") + get_question_from_local_storage(current_question, 'option3'));
            } else {
                $('#alx_line0_question').html(get_question_from_local_storage(current_question, 'question'));
                //$('#alx_line0_img').html(get_question_from_local_storage(current_question, 'image'));
                $('#alx_line1_option0').html(get_button("A", get_question_from_local_storage(current_question, 'correct')=='option0', "alx_line1_option0", true) + get_question_from_local_storage(current_question, 'option0'));
                $('#alx_line1_option1').html(get_button("Β", get_question_from_local_storage(current_question, 'correct')=='option1', "alx_line1_option1", true) + get_question_from_local_storage(current_question, 'option1'));
                $('#alx_line3_option2').html(get_button("Γ", get_question_from_local_storage(current_question, 'correct')=='option2', "alx_line3_option2", true) + get_question_from_local_storage(current_question, 'option2'));
                $('#alx_line3_option3').html(get_button("Δ", get_question_from_local_storage(current_question, 'correct')=='option3', "alx_line3_option3", true) + get_question_from_local_storage(current_question, 'option3'));
            }
    } else {
        console.log("Δεν υπάρχει ερώτηση με αυτό τον αριθμό");
    } 
});



