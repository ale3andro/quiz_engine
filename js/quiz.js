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
var activity_metadata = [];
var activity_data = [];
var activity_answers = [];
// 0 -> not answered yet
// 1 -> correct answer (on the first try)
// 2 -> wrong answer
// 3 -> correct (NOT on the first try)
var current_question = 0;

function answer_correct(id) {
    for (i=0; i<4; i++)     
        $('#alx_button_' + i).prop('disabled', true);
    
    $('#alx_option' + id).addClass('bg-success');
    if (activity_answers[current_question]==0) 
        activity_answers[current_question]=1;
    else 
        activity_answers[current_question]=3;
    set_score();
    
    if ((current_question+1)==activity_data.length) {
        build_status_breadcrumps(false);
        activity_end();
    } else {
        build_status_breadcrumps();
    }
}

function activity_end() {
    $('#alx_line0_img').html("<img class=\"img-responsive center-block\" width=\"300px\" height=\"300px\" src=\"img/loading.gif\">");
    var happy_emoji_url = 'happy00.gif';
    var sad_emoji_url = 'sad00.gif'
    $(':button').prop('disabled', true);
    $.ajax({
        url: 'emojis.txt',
        datatype: 'text',
        error: function() { console.log('Δεν ήταν δυνατή η ανάγνωση της λίστας emoji από τον server!'); },
        success: function(data){
            var happy_emojis = [];
            var sad_emojis = [];
            var rows = data.split('\n');
            for(var row = 0; row < rows.length; row++) {
                if (rows[row].indexOf("happy:")>=0)
                    happy_emojis.push(rows[row].substring(6));
                if (rows[row].indexOf("sad:")>=0)
                    sad_emojis.push(rows[row].substring(4));
            }
            happy_emoji_url = happy_emojis[Math.floor(Math.random() * happy_emojis.length)];
            sad_emoji_url = sad_emojis[Math.floor(Math.random() * sad_emojis.length)];
            var final_score = parseInt($('#alx_line_score').html().slice(0, -1));
            if (final_score>60)
                $('#alx_line0_img').html("<img class=\"img-responsive center-block\" width=\"300px\" height=\"300px\" src=\"img/" + happy_emoji_url + "\">");
            else
                $('#alx_line0_img').html("<img class=\"img-responsive center-block\" width=\"300px\" height=\"300px\" src=\"img/" + sad_emoji_url + "\">");
            if (sessionStorage.getItem("quest_return")!=null) {
                sessionStorage.setItem("quest" + sessionStorage.getItem("quest_ordinal") + "_is_complete", 'true');
                $("#alx_line0_question").html('<a href="' + sessionStorage.getItem("quest_return") + '"><img src="img/back_66percent.png""></a>');    
            }
        }
    })
}

function answer_wrong(id) {
    $('#alx_button_' + id).prop('disabled', true);
    $('#alx_option' + id).addClass('bg-danger');
    activity_answers[current_question]=2;
    set_score();
    build_status_breadcrumps();
}

function next_question() {
    setup_question(++current_question);
}

function set_score() {
    var sum=0;
    for (var i=0; i<activity_answers.length; i++) {
        if (activity_answers[i]==1)
            sum++;
    }
    var score = Math.floor((sum*100)/activity_answers.length); 
    console.log("Score: " + score);
    $('#alx_line_score').html(score + "%");
}

function setup_question(number) {
    $('#alx_line0_question').html(activity_data[number].question);
    // Reset option classes and button enabled props
    for (i=0; i<4; i++) {    
        $("#alx_option" + i).removeClass('bg-success').removeClass('bg-danger');
        $('#alx_button_' + i).prop('disabled', false);
    }
    
    $('#alx_option0').html(get_button("A", 0, (activity_data[number].option0==''?true:false), activity_data[number].correct=='option0') + activity_data[number].option0);
    $('#alx_option1').html(get_button("Β", 1, (activity_data[number].option1==''?true:false), activity_data[number].correct=='option1') + activity_data[number].option1);
    $('#alx_option2').html(get_button("Γ", 2, (activity_data[number].option2==''?true:false), activity_data[number].correct=='option2') + activity_data[number].option2);
    $('#alx_option3').html(get_button("Δ", 3, (activity_data[number].option3==''?true:false), activity_data[number].correct=='option3') + activity_data[number].option3);
    
    var img_url = 'quizes/' + getUrlParams('id') + '/' + activity_data[number].image;
    $('#alx_line0_img').html('<a href="' + img_url + '" data-lightbox="image-1" data-title="' + activity_data[number].question + 
            '"><img src="' + img_url + '" class="img-fluid" style="max-height: 200px;"></img>');
    build_status_breadcrumps();
};

function get_button(caption, id, disabled=false, correct=false) {
    var string_correct = 'onclick="answer_correct(' + id + ');"';
    var string_wrong = 'onclick="answer_wrong(' + id + ');"';
    var retval = '<button id="alx_button_' + id + '" type="button" ' + (correct?string_correct:string_wrong) + ' style="margin: 5px;" class="btn btn-primary" ' + (disabled?"disabled":"") + '>' + caption + '</button>';
    return retval;
}

function build_status_breadcrumps(next_enabled=true) {
    $('#alx_status').html('');
    /*
    if (is_correct && !has_next_question() && (get_value_from_metadata_local_storage("allow_reset")=="true") )
        $('#alx_status').html($('#alx_status').html() + '<li class="page-item"><img onclick="reset_quiz()" src="img/arrow_reload.png"></li>');
    var num_correct=0;
    var num_answered=0;
    */
    for (var i=0; i<activity_answers.length; i++) {
        var num_correct=0;
        var bg_color='';
        if (activity_answers[i]==1) {
            bg_color='bg-success';
            num_correct++;
        } else if (activity_answers[i]!=0)
            bg_color='bg-danger';
                        
        $('#alx_status').html($('#alx_status').html() + '<li class="page-item"><a class="page-link ' + bg_color + '" >' + (i+1) + '</a></li>');
    }
    if ( (next_enabled) && (current_question<activity_answers.length) && ( (activity_answers[current_question]==1) || (activity_answers[current_question]==3) ) )
        $('#alx_status').html($('#alx_status').html() + '<li class="page-item"><img onclick="next_question()" src="img/arrow_next.png"></li>');
}

// Suffle answers 2022.03.10 && 2022.03.24
function shuffle_answers() { 
    for (var q=0; q<activity_data.length; q++) {
        // Create an array of the initial options
        var options = [];
        options.push(activity_data[q].option0);   
        options.push(activity_data[q].option1);   
        if (activity_data[q].option2!='')  
            options.push(activity_data[q].option2);   
        if (activity_data[q].option3!='')
            options.push(activity_data[q].option3);   
        
        // Choose a random number
        var t_random = Math.floor(Math.random() * ((options.length-1) + 1));

        old_correct = parseInt(activity_data[q].correct.slice(-1));
        new_correct = old_correct + t_random;
        if (new_correct>=options.length)
            new_correct = new_correct - options.length;

        var options_shuffled = [];
        for (var t=0; t<options.length; t++) {
            var new_index = t + t_random;
            if (new_index>=options.length)
                new_index = new_index - options.length;

            options_shuffled[new_index] = options[t];
        }

        activity_data[q].option0 = options_shuffled[0];
        activity_data[q].option1 = options_shuffled[1];
        if (options_shuffled.length>2)
            activity_data[q].option2 = options_shuffled[2];
        if (options_shuffled.length>3)
            activity_data[q].option3 = options_shuffled[3];
        activity_data[q].correct = 'option' + new_correct;
    }
}

$( document ).ready(function() { 
    if ( (!('id' in getUrlParams())) || (getUrlParams('id')==undefined) || (getUrlParams('id')=='') ) {
        
        $.ajax({
            url: 'quizes/quizes_list',
            contentType: "text/plain",
            dataType: "text",
            success: function(result){
                var lines = result.split('\n');
                let activities = [];
                var counter=0;
                while (counter<(lines.length-1)) {
                    let activity = [ lines[counter++], lines[counter++], lines[counter++] ];
                    activities.push(activity);
                }
                console.log(activities);
                $('#alx_containter1').html('');
                $('#alx_containter2').html('');
                $('#alx_containter3').html('');
                $('#alx_containter0').html('Διαθέσιμα quiz');
                for (var i=0; i<activities.length; i++) {
                    $('#alx_containter1').html($('#alx_containter1').html() + "Τάξη " +  activities[i][1] + " - <a href='?id=" + activities[i][0].split('.')[0] + "'>" + activities[i][2] + "</a><br />");                }
             },
            error: function(jqXHR, textStatus, errorThrown) {
                console.log('Error parsing quizes list!');
            }
        });
        return;
    } 

    
    $.ajax({
        url: 'quizes/' + getUrlParams('id') + '.json',
        contentType: "application/json",
        dataType: "json",
        success: function(result){
            for (var i=0; i<result.length; i++) {
                if ('id' in result[i]) 
                    activity_metadata = result[i]
                else {
                    activity_data.push(result[i])
                    activity_answers.push(0);
                }
            }
            document.title = activity_metadata.description;
            $('#alx_line_msg').html(activity_metadata.description);
            if (activity_metadata.shuffle_answers=='true') {
                shuffle_answers();
                $('#alx_line_msg').html($('#alx_line_msg').html() + " (Ανακατεμένες απαντήσεις)")
            }
            
            setup_question(0);
         },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log('Error parsing quest!');
        }
    });
});






/*






function has_next_question() {
    return !(getUrlParams()['q']==sessionStorage.getItem("numQuestions")-1);
}

function next_question() {
    if (has_next_question()) {
        window.location = (location.protocol + '//' + location.host + location.pathname + '?id=' + getUrlParams('id') + "&q=" + (getUrlParams()['q']==undefined?'1':(parseInt(getUrlParams()['q'])+1)));
    }
}



function update_score(is_correct, div_id) {
    if (is_correct) {
        $('#' + div_id).addClass('bg-success text-white');
        if (!has_next_question()) {
            var cscore=$('#alx_line_score').html();
            cscore = cscore.substr(0, cscore.length-1).trim();
            
           
        }
    }
    else {
        $('#' + div_id).addClass('bg-danger text-white');
    }
    if (sessionStorage.getItem("question" + (getUrlParams()['q']==undefined?'0':(parseInt(getUrlParams()['q']))) + "_status")==0) 
        sessionStorage.setItem("question" + (getUrlParams()['q']==undefined?'0':(parseInt(getUrlParams()['q']))) + "_status", (is_correct?"1":"2"));
    rebuild_status_breadcrumps(is_correct);      
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
        case 'shuffle_answers':
            selection=6;
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
                //
                //  status=0 --> not answered yet
                //  status=1 --> correct answer
                //  status=2 --> wrong answer
                //
                sessionStorage.setItem("question" + question_count + "_status", 0);
                question_count+=1; 
            } else
                sessionStorage.setItem("metadata", metadata);
        });
        sessionStorage.setItem("numQuestions", question_count);
    }   
}

$( document ).ready(function() {
    // Disable browser's back button - https://www.itsolutionstuff.com/post/how-to-disable-browser-back-button-using-jqueryexample.html
    window.history.pushState(null, "", window.location.href);        
    window.onpopstate = function() {
        window.history.pushState(null, "", window.location.href);
    };

    if (!('id' in getUrlParams())) {
        $.ajax({
            url: 'quizes/quizes_list',
            datatype: 'text',
            error: function() { alert('Δεν ήταν δυνατή η ανάγνωση της λίστα των quizes!'); },
            success: function(data){
                $("#alx_line_score").html("999");
                $("#alx_line_msg").html("Διαθέσιμα κουίζ");
                $("#alx_line0_img").html("");
                $("#alx_line0_question").html("");
                $("#alx_containter1").html("");
                $("#alx_containter2").html("");
                $("#alx_containter3").html("");
            
                var lines = data.split('\n');
                var details=[];
                var details_line=new Array(3);
                var counter=0;
                for (var j = 0; j < lines.length; j++) {
                    if (lines[j]!="") {
                        details_line[counter]=lines[j];
                        counter++;
                        if (counter==3) {
                            counter=0;
                            details.push(details_line);
                            var details_line=new Array(3);
                        }
                    }
                }
                for (var j=0; j<details.length; j++) {
                    var t_line="<a target='_blank' href='?id=" + details[j][0].split('.').slice(0,-1).join() + "'>" + "Τάξη: " + details[j][1] + ": " + details[j][2] + "</a><br />";
                    $("#alx_containter1").html($("#alx_containter1").html() + t_line);
                }
            }
        })
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

    // TODO Shuffle questions if it is requested by the user
    //console.log(sessionStorage.getItem('metadata').split('||')[3]);
    q_num=0;
    if ('q' in getUrlParams())
        q_num = getUrlParams('q');
    if (debugging) {
        console.log('Αριθμός ερώτησης: ' + q_num);
        console.log(getUrlParams('q'));
    }
    if (debugging)
        console.log('Αριθμός ερωτήσεων: ' + parseInt(sessionStorage.getItem('numQuestions')));
    if (q_num>=0 && q_num<parseInt(sessionStorage.getItem('numQuestions'))) {  
            rebuild_status_breadcrumps();            
            var current_question = sessionStorage.getItem("question" + q_num);
            $('#alx_line_msg').html(get_value_from_metadata_local_storage("description"));
            if (get_value_from_metadata_local_storage("shuffle_answers")=="true") 
                $('#alx_line_msg').html($('#alx_line_msg').html()+' (Ανακατεμένες απαντήσεις)');
            $('#alx_line_msg').html($('#alx_line_msg').html() + "<p class=\"font-weight-bold\">Ερώτηση: " + (parseInt(q_num)+1) + "</p>");

            var img_url = 'quizes/' + getUrlParams()['id'] + '/' + get_question_from_local_storage(current_question, "image");
            $('#alx_line0_img').html('<a href="' + img_url + '" data-lightbox="image-1" data-title="' + get_question_from_local_storage(current_question, 'question') + '"><img src="' + img_url + '" class="img-fluid" style="max-height: 200px;">');
            document.title = get_value_from_metadata_local_storage("description");
            if (sessionStorage.getItem("question" + q_num + "_status")==0)
            {
                $('#alx_line0_question').html(get_question_from_local_storage(current_question, 'question'));
                $('#alx_line1_option0').html(get_button("A", get_question_from_local_storage(current_question, 'correct')=='option0', "alx_line1_option0") + get_question_from_local_storage(current_question, 'option0'));
                $('#alx_line1_option1').html(get_button("Β", get_question_from_local_storage(current_question, 'correct')=='option1', "alx_line1_option1") + get_question_from_local_storage(current_question, 'option1'));
                if (get_question_from_local_storage(current_question, 'option2')!='')
                    $('#alx_line3_option2').html(get_button("Γ", get_question_from_local_storage(current_question, 'correct')=='option2', "alx_line3_option2") + get_question_from_local_storage(current_question, 'option2'));
                else
                    $('#alx_line3_option2').html(get_button("Γ", false, "alx_line3_option2", true));
                
                if (get_question_from_local_storage(current_question, 'option3')!='')
                    $('#alx_line3_option3').html(get_button("Δ", get_question_from_local_storage(current_question, 'correct')=='option3', "alx_line3_option3") + get_question_from_local_storage(current_question, 'option3'));
                else
                    $('#alx_line3_option3').html(get_button("Δ", false, "alx_line3_option3", true));
            } else {
                $('#alx_line0_question').html(get_question_from_local_storage(current_question, 'question'));
                
                $('#alx_line1_option1').html(get_button("Β", get_question_from_local_storage(current_question, 'correct')=='option1', "alx_line1_option1", true) + get_question_from_local_storage(current_question, 'option1'));
                $('#alx_line3_option2').html(get_button("Γ", get_question_from_local_storage(current_question, 'correct')=='option2', "alx_line3_option2", true) + get_question_from_local_storage(current_question, 'option2'));
                $('#alx_line3_option3').html(get_button("Δ", get_question_from_local_storage(current_question, 'correct')=='option3', "alx_line3_option3", true) + get_question_from_local_storage(current_question, 'option3'));
            }
    } else {
        console.log("Δεν υπάρχει ερώτηση με αυτό τον αριθμό");
    } 
});

*/


