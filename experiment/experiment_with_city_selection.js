function shuffle(array) {
    let currentIndex = array.length,  randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
    return array;
}


function assignButtonText(button_id,button_text){
    document.getElementById(button_id).innerHTML = button_text;
}

function postData(data_obj){
    $.ajax({
        url: "your-url-here",
        type: "POST",
        data: JSON.stringify(data_obj)
    });
}

async function runExperiment(){

    // Get condition, color, model cities, ect, 
    await experimentSetup();

    // Make the non-trials pages
    generateInstructions();

    // Generate the "practice" trial used for data exclusion
    generatePracticeTrial();

    // Make the trials pages
    generateTrials();

    // Generat the comprehension quiz for assessing expertise
    generateComprehensionQuestions();

    // Make the timeline and start
    generateTimeline();
    jsPsych.run(timeline);
}

function sampleCities(data,column_name,column_value,num_values=undefined){
    const all_data = shuffle(data.filter(d=>d[column_name] == column_value))
    all_data.forEach(d=>d.type=column_name);
    if (num_values===undefined) return all_data;
    return(all_data.slice(0,num_values))
}

async function experimentSetup(){
    // Get city data
    const city_data =  await d3.csv('city_data.csv');
    model_cities = sampleCities(city_data,'model_city',1);
    model_cities = model_cities.sort((a, b) => a.name > b.name ? 1 : -1);
    const kind_cities =  sampleCities(city_data,'kind',1,1);
    let challenging_city_name = '';
    let challenging_cities;
    while (challenging_city_name !== 'Tokyo'){
        challenging_cities =  sampleCities(city_data,'challenging',1,1);
        challenging_city_name = challenging_cities[0].name;
    };
    const wicked_cities =  sampleCities(city_data,'wicked',1,1);
    prediction_cities = shuffle(new Array(...kind_cities,...challenging_cities,...wicked_cities));
    prediction_cities = (new Array(...challenging_cities,...kind_cities,...wicked_cities));

    // Get condition, instruction_condition, and model assistance
    const conditions = ['model-choice','forced-no-model'];
    const instruction_conditions = [true,false];
    const queryString = window.location.search;
    const url_params = new URLSearchParams(queryString);
    condition = url_params.get('condition');
    console.log('condition',condition);
    //instruction_info = url_params.get('instruction_info')
    if (condition === null) condition = conditions[Math.floor(Math.random()*conditions.length)];
    //instruction_info === null ? instruction_info = instruction_conditions[Math.floor(Math.random()*instruction_conditions.length)] : instruction_info = instruction_info === 'true';
    model_assistance = condition === 'model-choice';
    
    // Other setup
    [predictor_color, model_color] = shuffle(['red', 'blue']);
    turk_info = jsPsych.turk.turkInfo();
    jsPsych.data.addProperties({
        ...turk_info,
        condition,
        prediction_cities,
        model_cities,
        predictor_color,
        user_agent: window.navigator.userAgent,
        model_assistance
    });
}

function generateInstructions(){

    const consent_text = `
        <div class = 'consent-text'>

        <h1 class = 'consent-title'>Microsoft Research Project Participation Consent Form</h1>
        <hr>
        <h2>INTRODUCTION</h2>

        <p>Thank you for taking the time to consider volunteering in a Microsoft Corporation research project. 
        This form explains what would happen if you join this research project. 
        Please read it carefully and take as much time as you need. Email the study team to ask about anything that is not clear.</p>

        <p>Participation in this study is voluntary and you may withdraw at any time.</p>

        <h2>TITLE OF RESEARCH PROJECT</h2>
        <p>Intuitive forecasting</p>

        <p>Principal Investigator: Dan Goldstein</p>

        <h2>PURPOSE</h2>
        <p>The purpose of this project is to study how people reason and make forecasts about the future.</p>

        <h2>PROCEDURES</h2>
        <p>During this project, you will be asked to forecast the high temperature in a certain city
        on the first day of each month.</p>

        <p>Microsoft may document and collect information about your participation by recording your answers.</p>

        <p>Approximately 1500 participants will be involved in this study.</p>

        <h2>PERSONAL INFORMATION</h2>
        <p>Aside from some optional responses on your current location and preferred temperature scale, 
        no personal information will be collected during this study. 
        This anonymous data may be used for future research or given to another investigator for future use without additional consent.</p>

        <p>Microsoft Research is ultimately responsible for determining the purposes and uses of data collected through this study.</p>

        <p>For additional information or concerns about how Microsoft handles your personal information, 
        please see the <a href='https://privacy.microsoft.com/en-us/privacystatement' target='_blank'>Microsoft Privacy Statement</a>.</p>

        <p>For Employees, External Staff and Candidates please use the <a href='https://go.microsoft.com/fwlink/?LinkId=518021' target='_blank'>Microsoft Global Data Privacy Notice</a>.</p>

        <h2>BENEFITS AND RISKS</h2>
        <p>Benefits: There are no direct benefits to you that might reasonably be expected as a result of being in this study. 
        The research team expects to learn about human decision making from the results of this research, 
        as well as any public benefit that may come from these research results being shared with the greater scientific community.</p>

        <p>Risks: The risk for this study is no higher than encountered in everyday life.</p>

        <h2>PAYMENT FOR PARTICIPATION</h2>
        <p>You will be paid $1.50 for completing this study.</p>

        <p>Your data may be used to make new products, tests or findings. 
        These may have value and may be developed and owned by Microsoft and/or others. 
        If this happens, there are no plans to pay you.</p>

        <h2>CONTACT INFORMATION</h2>
        <p>Should you have any questions concerning this project, or if you are injured as a result of being in this study, please contact us at mdhardy@princeton.edu</p>

        <p>Should you have any questions about your rights as a research subject, please contact Microsoft Research Ethics Program Feedback at MSRStudyfeedback@microsoft.com.</p>

        <h2>CONSENT</h2>
        <p>By clicking "I agree" below, you confirm that the study was explained to you, you had a chance to ask questions before beginning the study, 
        and all your questions were answered satisfactorily. 
        By clicking "I agree" below, you voluntarily consent to participate, and you do not give up any legal rights you have as a study participant.

        Thank you for your contribution and we look forward to your research session.
        </div>
        <label id="check_label">
        <input type="checkbox" id="consent_checkbox">
        I agree to this consent form
        </label>
        `

    const common_text = `You will now complete ${prediction_cities.length} actual trials.`;

    const no_model_text = `<h2>Instructions</h2>
    <div class = 'instructions-wrapper center-text'>${common_text}</div>&nbsp;`;

    const model_text =  `<h2>Instructions</h2>
    <div class = 'instructions-wrapper'>
        <ul>
            <li>${common_text}</li>
            <li>To help you make your choice on test trials, you can observe the predicted highs in certain US cities.</li>
        </ul>
    </div>`

    const instructions_3_text = model_assistance ? model_text : no_model_text;

    const instructions_text = [
        `<h2>Instructions</h2>
        <div class = 'instructions-wrapper'><ul>
        <li>In this experiment, we are interested in your best guesses. 
        For this reason, it's important that you don't look up answers on the internet. 
        Doing so would ruin the experiment.</li>
        <li>Don't worry, your payment is <b>not</b> based on your accuracy. Instead, please make your best guess.</li>
        <li>Please check to accept the statement below:</li></ul>
        </div>
        <label id="check_label">
        <input type="checkbox" id="consent_checkbox">
        I agree to take my best guesses and not to look up answers on the internet.
        </label>`,
        `<h2>Instructions</h2>
        <div class = 'instructions-wrapper'>
            <ul>
                <li>In this HIT, you will make predictions about the high temperatures in different cities.</li>
                <li>You will first complete one practice trial.</li>
            </ul>
        </div>`,
        `<div class = 'instructions-wrapper center-text'>
        <p>Before finishing this HIT, we will ask you to take a short weather-knowledge quiz. 
        These questions should take just a few minutes.</p>
        </div>
        <br>`,
        `<div class = 'instructions-wrapper center-text' id= 'text-div'>
        <p>Thank you for your participation. 
        You <span class = 'bold-red'>must</span> click the button below to get paid for this HIT.</p>
        <button class = 'jspsych-btn' id='finish-experiment'>Finish experiment</button>
        </div>
        <br>`];

    index_check = {
        type: jsPsychInstructions,
        show_clickable_nav:true,
        allow_backward: false,
        allow_keys:false,
        button_label_next: 'Start HIT',
        pages: [`
            <div id = 'main-text' class = 'instructions-wrapper center-text'>
            <p class = 'bold-red'>If you have seen this survey before or one like it, please return the HIT.</p></div>`
            // <button id = 'take-hit' class='jspsych-btn'>Check eligibility</button>
            // </div>
        ],
        on_load:function(){
            start_time =  new Date();
            assignButtonText('jspsych-instructions-next',this.button_label_next);
        },
        on_finish:async function(data){
            data.start_time = start_time
            data.end_time = new Date();
            data.page = 'consent'
            postData(data)
        }
    }

    consent = {
        type: jsPsychInstructions,
        show_clickable_nav:true,
        allow_backward: false,
        allow_keys:false,
        button_label_next: 'Continue',
        pages: [consent_text],
        on_load:function(){
            assignButtonText('jspsych-instructions-next',this.button_label_next);
            const start_button = document.getElementById('jspsych-instructions-next');
            start_button.disabled = true;
            start_button.style.marginBottom = '20px';
            start_button.style.marginTop = '10px';
            document.getElementById('consent_checkbox').addEventListener('change',function(){
                start_button.disabled = !this.checked;
            }),
            start_time =  new Date();
        },
        on_finish:async function(data){
            data.start_time = start_time
            data.end_time = new Date();
            data.page = 'consent'
            postData(data)
        }
    };

    
    instructions_page_1 = {
        type: jsPsychInstructions,
        show_clickable_nav:true,
        allow_backward: false,
        allow_keys:false,
        button_label_next: 'Continue',
        pages: [instructions_text[0]],
        on_load:function(){
            assignButtonText('jspsych-instructions-next',this.button_label_next);
            const start_button = document.getElementById('jspsych-instructions-next');
            start_button.disabled = true;
            start_button.style.marginTop = '10px';
            document.getElementById('consent_checkbox').addEventListener('change',function(){
                start_button.disabled = !this.checked;
            })
            start_time = new Date();
        },
        on_finish:function(data){
            data.page = 'instruct-1';
            data.end_time = new Date();
            postData(data);
        }
    };

    instructions_page_2 = {
        type: jsPsychInstructions,
        show_clickable_nav:true,
        allow_backward: false,
        allow_keys:false,
        button_label_next: 'Continue',
        pages: [instructions_text[1]],
        on_load:function(){
            assignButtonText('jspsych-instructions-next',this.button_label_next);
            start_time = new Date();
        },
        on_finish:function(data){
            data.page = 'instruct-2';
            data.end_time = new Date();
            postData(data);
        }
    };

    instructions_page_3 = {
        type: jsPsychInstructions,
        show_clickable_nav:true,
        allow_backward: false,
        allow_keys:false,
        button_label_next: 'Continue',
        pages: [instructions_3_text],
        on_load:function(){
            assignButtonText('jspsych-instructions-next',this.button_label_next);
            start_time = new Date();
        },
        on_finish:function(data){
            data.page = 'intruct-3';
            data.end_time = new Date();
            postData(data);
        }
    };


    trials_end = {
        type: jsPsychInstructions,
        show_clickable_nav:true,
        allow_backward: false,
        allow_keys:false,
        pages: [instructions_text[2]],
        button_label_next: 'Continue',
        on_load:function(){
            assignButtonText('jspsych-instructions-next','Continue');
            start_time = new Date();
        },
        on_finish:function(data){
            data.page = 'trials-end';
            data.end_time = new Date();
            postData(data);
        }
    };

    temperature_scale = {
        type: jsPsychSurveyMultiChoice,
        questions: [
            {
                prompt: "I am more familiar thinking about high temperatures in:", 
                name: 'temperature_scale', 
                options: shuffle(['Fahrenheit','Celsius']), 
                required: true,
            }, 
        ],
        on_load:function(){
            start_time = new Date();
        },
        on_finish:function(data){
            data.page = 'temperature-scale';
            data.end_time = new Date();
            postData(data);
        }
    };

    zip_code = {
        type: jsPsychSurveyText,
        questions: [
            {prompt: '(Optional) What is your zip code?'},
        ],
        on_load:function(){
            d3.select('#input-0')
            .style('padding','10px')
            .style('font-size','16px')
            .attr('size','10')
            .attr('type','number');
            start_time = new Date();
        },
        on_finish:function(data){
            data.page = 'zip-code';
            data.end_time = new Date();
            postData(data);
        }
    };

    feedback = {
        type: jsPsychInstructions,
        show_clickable_nav:true,
        allow_backward: false,
        allow_keys:false,
        data: {feedback:''},
        pages: [
            `<div class = 'instructions-wrapper center-text' id= 'text-div'>
            <p>(Optional) Was there anything in the HIT that was unclear or confusing?</p>
            <textarea id="feedback" rows="5" cols="60"></textarea>
            </div>`
        ],
        buton_label_next:'Continue',
        on_load:function(){
            assignButtonText('jspsych-instructions-next','Continue');
            start_time = new Date();
            const that = this;
            document.getElementById('feedback').addEventListener('input',function(){
                that.data.feedback = this.value;
            })
        },
        on_finish:function(data){
            data.page = 'feedback';
            data.end_time = new Date();
            postData(data);
        }
    };

    experiment_end = {
        type: jsPsychInstructions,
        pages: [instructions_text[3]],
        allow_backward: false,
        allow_keys:false,    
        show_clickable_nav:false,
        on_load:function(){
            // assignButtonText('jspsych-instructions-next','Finish experiment');
            document.getElementById('finish-experiment').addEventListener('click',function(){
                this.disabled = true;
                document.getElementById('text-div').innerHTML = `<p>Submitting, don't close the window...</p>`;
                let jspsych_data = jsPsych.data.get();
                let experiment_data = {
                    ...jspsych_data,
                    ...turk_info,
                    all_experiment_data: true,
                    submission_time: new Date()
                }
                $.ajax({
                url: "https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response",
                //contentType: "application/json",
                type: "POST",
                //datatype: "json",
                data: JSON.stringify(experiment_data),
                success: function (data) {
                    
                    // jsPsych.endExperiment('Submitted!');
                    jsPsych.turk.submitToTurk(experiment_data);
                    // document.getElementById('text-div').innerHTML = `<p>Submitted!</p>`
                },
                error: function (request, error) {
                    jsPsych.endExperiment('There was an error submitting your HIT. Please email <b>mdhardy@princeton.edu</b> if you do not receive your payment.');
                    // jsPsych.turk.submitToTurk();
                }
                });
            })
        }
    };
}

function generateComprehensionQuestions(){

    const comprehension_questions = shuffle([
        {
            prompt: 'How much is 0° Celsius in Fahrenheit?',
            options: ['0°','32°','34°','100°'],
            correct_answer:'32°',
            name: 'question-0',
            required:true
        },
        {
            prompt: 'What does a barometer measure?',
            options: shuffle(['Atmospheric pressure', 'Rainfall','Temperature','High tide']),
            correct_answer:'Atmospheric pressure',
            name: 'question-1',
            required:true
        },
        {
            prompt: 'What is climate?',
            options: shuffle(['The amount of rain an area receives',
            'The condition of the atmosphere at a certain place and time',
            'The temperature of the air',
            'The average weather over an extended period of time']),
            correct_answer:'The average weather over an extended period of time',
            name: 'question-2',
            required:true
        },
        {
            prompt: 'Which of these statements is true?',
            options: shuffle([
                'Land absorbs and stores more heat energy than oceans',
                'Land heats up and cools down quicker than oceans',
                'Oceans heat up and cool down quicker than land',
                'Oceans and land heat up and cool down at the same speed']),
            correct_answer:'Land heats up and cools down quicker than oceans',
            name: 'question-3',
            required:true
        },
        {
            prompt: 'Is the atmospheric pressure inside a tropical storm higher or lower than normal?',
            options: shuffle(['Higher', 'Lower']),
            correct_answer: 'Lower',
            name: 'question-4',
            required:true
        },
        {
            prompt: 'When it is summer in the southern hemisphere it is:',
            options: shuffle([
                'Winter in the northern hemisphere',
                'Spring in the northern hemisphere',
                'Summer in the northern hemisphere',
                'Fall in the northern hemisphere'
            ]),
            correct_answer:'Winter in the northern hemisphere',
            name: 'question-5',
            required:true
        },
        {
            prompt: 'Which is the technical term for the moisture content in the air?',
            options: shuffle(['Heat density', 'Humidity','Condensation','Evaporation']),
            correct_answer:'Humidity',
            name: 'question-6',
            required:true
        },
        {
            prompt: 'If a weather forecaster predicts "high pressure" what kind of weather would we expect?',
            options: shuffle(['Calm weather', 'Stormy weather','Snowy weather']),
            correct_answer:'Calm weather',
            name: 'question-7',
            required:true
        },
        {
            prompt: 'What type of cloud is most likely to produce rain, thunder, and lightning?',
            options: shuffle(['Cirrus', 'Stratus','Cumulus','Cumulonimbus']),
            correct_answer:'Cumulonimbus',
            name:'question-8',
            required:true
        },
        {
            prompt: 'Why does wind chill decrease the temperature felt by our skin?',
            options: shuffle(['It increases heat transfer from the body to the environment',
            'It decreases heat transfer from the body to the environment',
            'It increases heat transfer from the environment to the body',
            'It causes precipitation to become more frequent, thus lowering ambient temperatures']),
            correct_answer:'It increases heat transfer from the body to the environment',
            name: 'question-9',
            required:true
        }
    ]);

    comprehension_trial = {
        type: jsPsychSurveyMultiChoice,
        preamble: `<p>Please answer the following questions to the best of your ability.<br>
                    Again, your payment is <b>not</b> based on accuracy so please do not look up any answers.</p>`, 
        questions: shuffle(comprehension_questions),
        on_load:function(){
            start_time = new Date();
            d3.select('#jspsych-survey-multi-choice-next').style('margin-bottom','20px');
            // d3.select('.required').remove();
            // d3.selectAll('.jspsych-survey-multi-choice-option')
            //     .style('width','80px')
            //     .style('margin','0 auto');
            // d3.select('#instructions').style("text-align",'center');
        },
        on_finish:function(data){
            let response_indices = {};
            let answered_correct = {};
            for (let i=0; i<comprehension_questions.length; i++){
                const curr_name = comprehension_questions[i].name;
                const curr_answer = data.response[curr_name];
                response_indices[curr_name] =  comprehension_questions[i].options.indexOf(curr_answer);
                const correct_answer = comprehension_questions[i].correct_answer;
                answered_correct[curr_name] = curr_answer === correct_answer;
            }
            data.answered_correct = answered_correct;
            data.response_indices = response_indices;
            data.page = 'comprehension-test';
            data.end_time = new Date();
            postData(data);
        }
    }
}

function generatePracticeTrial(){
    practice_trial = {
        type: modelTrialWithSelection,
        model_cities,
        predictor_city:'Berlin',
        predictor_state: 'Germany',
        model_assistance: false,
        predictor_color,
        model_color,
        trial_num: 0,
        workerId: turk_info.workerId,
        hitId: turk_info.hitId,
        assignmentId: turk_info.assignmentId,
        condition,
        predictor_city_type: 'practice',
        is_practice:true
    }

}

function generateTrials(){
    let trial_num = 1;
    trials = [];
    for (let city of prediction_cities){
        let trial = {
            type:modelTrialWithSelection,
            model_cities,
            predictor_city:city.name,
            predictor_state:city.state,
            model_assistance,
            predictor_color,
            model_color,
            trial_num,
            workerId: turk_info.workerId,
            hitId: turk_info.hitId,
            assignmentId: turk_info.assignmentId,
            condition,
            predictor_city_type: city.type,
            on_start:function(trial){
                trial.model_assistance = model_assistance;
            }
        }
        trials.push(trial);
        trial_num++;
    }
}

function generateTimeline(){
    timeline = [];
    timeline.push(
        consent,
        instructions_page_1,
        instructions_page_2,
        practice_trial,
        instructions_page_3,
        ...trials, 
        trials_end,
        comprehension_trial,
        temperature_scale, 
        zip_code,
        feedback,
        experiment_end,
    );
}

let model_cities, predictor_cities, condition, predictor_color,model_color, start_time, turk_info, 
consent, index_check, instructions_page_1, instructions_page_2, 
trials_end, experiment_end, temperature_scale, zip_code, feedback, trials, timeline,model_assistance, 
comprehension_trial, practice_trial, instructions_page_3;

const jsPsych = initJsPsych({
    show_progress_bar: true
    // exclusions: {
    //   min_width: 1000,
    //   min_height: 550
    // }
  });

runExperiment();