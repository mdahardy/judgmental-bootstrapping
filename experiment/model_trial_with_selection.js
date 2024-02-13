const modelTrialWithSelection = (function (jspsych) {
    "use strict";
  
    const info = {
      name: "modelTrialWithSelection",
      parameters: {
        // The city the participant is making predictions for
        predictor_city: {
            type: jspsych.ParameterType.STRING,
            default: undefined,
        },
        predictor_state: {
          type: jspsych.ParameterType.STRING,
          default: undefined,
        },
        // T/F for whether the participant observes the average temperatures for a different city
        model_assistance:{
          type: jspsych.ParameterType.BOOL,
          default:undefined
        },
        // A list of every model city (states and coordinates are also included here)
        model_cities: {
          type: jspsych.ParameterType.STRING,
          default: 'undefined',
        },
        // How long (in milliseconds) to display the loading text before each trial
        loading_time:{
          type: jspsych.ParameterType.INT,
          default:500
        },
        // Is the color of the prediction elements (lines, points, and text backgrounds) red or blue?
        // If there is model assistance, the model color will be (red, blue) when predictor_color is (blue, red)
        // This color is randomized between participants in experiment.js
        predictor_color:{
          type:jspsych.ParameterType.STRING,
          default:undefined
        },
        // The color for the model city (blue when predictor_color is red, and red when it is blue) 
        model_color:{
          type:jspsych.ParameterType.STRING,
          default:undefined
        },
        trial_num:{
          type:jspsych.ParameterType.INT,
          default:undefined
        },
        workerId:{
          type:jspsych.ParameterType.STRING,
          default:undefined
        },
        assignmentId:{
          type:jspsych.ParameterType.STRING,
          default:undefined
        },
        hitId:{
          type:jspsych.ParameterType.STRING,
          default:undefined
        },
        // A string representing the condition. Not used, just for easier data storage
        condition: {
          type: jspsych.ParameterType.STRING,
          default: undefined,
        },
        predictor_city_type:{
          type: jspsych.ParameterType.STRING,
          default: undefined,
        },
        is_practice:{
          type: jspsych.ParameterType.BOOL,
          default: false,
        },
        instruction_info:{
          type: jspsych.ParameterType.BOOL,
          default: false,
        }
      },
    };
  
    class PluginNamePlugin {
      constructor(jsPsych) {
        this.jsPsych = jsPsych;
        this.form_ready = false; // All months have predictions and the form can be filled out
        this.total_width = 450; // Width of the weather plot including margins
        this.total_height = 305; // Height of the weather plot including margins
        this.margin_top = 5; // Plot margins
        this.margin_right = 10;
        this.margin_bottom = 50;
        this.margin_left = 65;
        this.month_names = ["Jan", "Feb", "Mar", "Apr", "May", "June","July", "Aug", "Sep", "Oct", "Nov", "Dec"];
        this.full_month_names = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
        this.shown_user_points = []; // Vector that holds users predictions (used to plot the user curve)
        this.min_temperature = 0; // Min temperature for y axis 
        this.max_temperature = 125; // Max temperature for y axis
        this.city_selector_ready;
        this.model_city = undefined;
        this.model_state = undefined;
        this.first_movement = true;
        this.regression_predictions = {};
      }
      // -- -- -- -- -- -- 
      // PLOTTING FUNCTIONS
      // -- -- -- -- -- -- 

      // Helper function for removing spaces
      spacesToUnderline(input_string){
        return input_string.replaceAll(' ','_');
      }
      
      // Set up plot scales and dimensions
      plotSetup(){
        this.inner_height = this.total_height - (this.margin_bottom + this.margin_top);
        this.inner_width = this.total_width - (this.margin_left + this.margin_right);
        this.x_scale = d3.scaleLinear()
          .domain([0.5,12.5])
          .range([0,this.inner_width])
          .clamp(true);
        this.y_scale = d3.scaleLinear().domain([this.min_temperature,this.max_temperature]).range([this.inner_height,0]);
      }

      // Generate the SVG element for making the plot
      makeSVG(){
        this.plot_svg = d3.select('#model-svg-wrapper')
          .append('svg')
          .attr('width',this.total_width)
          .attr("height",this.total_height)
          .append('g')
          .style('transform',`translate(${this.margin_left}px,${this.margin_top}px)`); 
      }

      // Draw x and x axis on plots
      drawAxes(){
        this.plot_svg.append('g')
          .attr("id", "y-axis")
          .call(d3.axisLeft(this.y_scale)
          .tickSizeOuter(0)
          );
        this.plot_svg.append('g')
            .attr("id", "x-axis")
            .style('transform',`translateY(${this.inner_height}px)`)
            .call(
              d3.axisBottom(this.x_scale)
                .ticks(12)
                // .tickValues([0.5,1.5,2.5,3.5,4.5,5.5,6.5,7.5,8.5,9.5,10.5,11.5])
                .tickFormat(d=>this.month_names[d-1])
                .tickSizeOuter(0)
              )
              .selectAll("text")  
              .style("text-anchor", "end")
              .attr("dx", "-0.3em")
              .attr("dy", "0.42em")
              .attr("transform", "rotate(-45)");
      }

      // Add label to y axis (x axis already clear)
      addYAxisLabel(){
        // this.plot_svg
        //     .append("text")
        //     .attr("text-anchor", "middle")
        //     .attr('dominant-baseline','middle')
        //     .attr("x", this.inner_width/2)
        //     .attr("y", this.inner_height + 64)
        //     .text("Date");
        this.plot_svg
              .append("text")
              .attr("text-anchor", "middle")
              .attr('dominant-baseline','middle')
              .attr('class','axis-title')
              .style("transform", `rotate(-90deg) translate(-${this.inner_height/2}px,-53px)`)
              .text("Temperature (°F)"); 

      }

      // Draw the grid lines on the x and y axis tick locations 
      drawGridLines(){
        // Y axis gridlines
        d3.selectAll("#y-axis .tick")
          .append("line")
          .attr("class", "gridline")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", this.inner_width)
          .attr("y2", 0);

        // X axis gridlines
        d3.selectAll("#x-axis .tick")
          .append("line")
          .attr("class", "gridline")
          .attr("x1", 0)
          .attr("y1", -this.inner_height)
          .attr("x2", 0)
          .attr("y2", 0);

      }

      // Draw the dots for the model city (for visual evaluation of the LOESS regression)
      // drawModelDots(data){

      //   this.plot_svg
      //     .append('g')
      //     .selectAll('dot')
      //     .data(data)
      //     .enter()
      //     .append('circle')
      //     .attr('cx', d=>this.x_scale(d.month))
      //     .attr('cy', d=>this.y_scale(d.average_hi))
      //     .attr('r',6)
      //     .attr('class',`model-dot-${this.model_color}`);
      // }

      // Draw the temperature line for the model city using a LOESS regression on the average temperature for each day

      getRegressionPrediction(month,regression){
        let prediction = 0;
        regression.coefficients.forEach((d,i)=>{prediction += month**(i) * d});
        return prediction;
      }

      runRegression(data){
        const regressionGenerator = d3.regressionPoly()
        .x(d=>d.month)
        .y(d=>d.average_hi)
        .order(4);

        const regression = regressionGenerator(data);

        let regression_data = [];
        for (let month = 1; month<=12; month++){
          regression_data.push({
              month,
              prediction: this.getRegressionPrediction(month,regression)
            })
        }

        this.regression_data = regression_data;
      }
      
      drawModelDots(data){

        this.runRegression(data);

        this.plot_svg
          .append('g')
          .selectAll('rect')
          .data(this.regression_data)
          .enter()
          .append('rect')
          .attr('x', d=>this.x_scale(d.month)-5)
          .attr('y', d=>this.y_scale(d.prediction)-5)
          .attr("width",10)
          .attr('height',10)
          .attr('class',`model-square-${this.model_color}`);

      }

      // Update the vector of data storing the user's estimates. This then plotted as points and a path
      updateUserPointData(month_str){
        const month = this.month_names.indexOf(month_str.replaceAll('-',' '))+1;
        this.shown_user_points = this.shown_user_points.filter(d=>d.month !== month);
        const text_value = d3.select(`#${month_str}`).node().value;
        if (text_value!==''){
          this.shown_user_points.push({
            month,
            temp: +text_value
          });
          // Sort points for correct ordering in line plot
          this.shown_user_points = this.shown_user_points.sort((a, b) => d3.ascending(a.month, b.month))        
        }
      }

      // Helper function: Returns T/F for whether the users point is within the plot's y-axis boundaries
      userPointWithinRange(temperature){
        if (temperature < this.min_temperature) return false;
        if (temperature > this.max_temperature) return false;
        return true;
      }

      // Plot the participant's estimates on the plot as points
      drawUserPoints(){
        const filtered_points = this.shown_user_points.filter(d=>this.userPointWithinRange(d.temp));
        const user_points = this.plot_svg
                  .selectAll('.user-point')
                  .data(filtered_points,d=>d.month_index);
            

        user_points
                .enter()
                .append('circle')
                .merge(user_points)
                .attr('cx', d=>this.x_scale(d.month))
                .attr('cy',d=>this.y_scale(d.temp))
                .attr('r',6)
                .attr('class',`user-point ${this.predictor_color}-point`);

        user_points.exit().remove();
      }

      // Draw the line connect the dots for the participant's estimates
      drawUserLine(){
        this.plot_svg.select('#user-line').remove();
        this.plot_svg
          .append("path")
          .datum(this.shown_user_points)
          .attr('id','user-line')
          .attr("class",`city-curve ${this.predictor_color}-curve`)
          .attr("clip-path", "url(#user-line-clip)")
          .attr("d", d3.line()
            .x(d=>this.x_scale(d.month))
            .y(d=>this.y_scale(d.temp))
          )
      }

      // Generate the tooltip
      makeTooltip(){
        d3.select('#model-svg-wrapper')
          .append('div')
          .attr('id','tooltip')
          .style('left',`${this.margin_left}px`)
          .attr('class',`tooltip-${this.model_color}`)
          .style("top",`${this.margin_top + 6}px`)
          .html(`<span id='tooltip-date'></span>: <span id='tooltip-average'></span>°F`);

        // Add rect to the plot that will be used to trigger events
        this.plot_svg
          .append('rect')
          .attr('id','hover-rect')
          .attr("width",this.inner_width)
          .attr('height',this.inner_height)
          .attr('opacity','0');
      }

      clampMonth(x_amount){
        let raw_x = Math.round(this.x_scale.invert(x_amount));
        if (raw_x >= 12) return 12;
        if (raw_x <= 1) return 1;
        return raw_x;
      }

      // Show/hide the tooltip and adjust position and text
      updateTooltip(x_amount){
        const month = this.clampMonth(x_amount);
        const estimated_hi = Math.round(this.regression_data[month-1].prediction);
        document.getElementById('tooltip-average').innerHTML = estimated_hi;
        const month_string = this.full_month_names[month-1];
        document.getElementById('tooltip-date').innerHTML = `${month_string}`;
        const translate_x = month >= 7 ? -150 : 0;
        d3.select('#tooltip')
          .style('opacity',1)
          .style('left',`${this.x_scale(month) + this.margin_left}px`)
          .style("transform",`translateX(${translate_x}px)`);

      }


      // Generate the clip path for the User line graph
      makeClipPath(){
        this.plot_svg
          .append('clipPath')
          .attr('id','user-line-clip')
          .append('rect')
          .attr('width',this.inner_width)
          .attr("height",this.inner_height);
      }

      // Given the city in the trial, generate the path for the relevant city data
      generateDataURL(trial){
        const city_str = this.spacesToUnderline(this.model_city);
        return `../monthly_averages/${city_str}.csv`;
      }

      async loadPlotData(data_path){
        let data = await d3.csv(data_path);
        data.forEach(d=>{
          d.month = +d.month;
          d.average_hi = +d.average_hi
        });
        return data;
      }

      // Make the city plot
      // If model assistance, make the plot for the model city
      // Otherwise, just set up the plot
      async makeCityPlot(trial){
        this.plotSetup(trial);
        this.makeSVG();
        this.makeClipPath();
        this.drawAxes();
        this.addYAxisLabel()
        this.drawGridLines();
        if (trial.model_assistance){
          const data_path = this.generateDataURL(trial);
          const data = await this.loadPlotData(data_path)
          this.plot_data = data;
          //this.drawModelDots(data);
          this.drawModelDots(data);
          this.makeTooltip();
        }
        //this.addLegend(trial);
      }



      // addLegend(trial){
      //   let legend_data = [{city:trial.predictor_city,type:'user'}];
      //   if (trial.model_assistance) legend_data.unshift({city:trial.model_city,type:'model'});

      //   const legend_group = this.plot_svg.append('g');


      //   //Background rect
      //   legend_group
      //     .append('rect')
      //     .attr('x',275)
      //     .attr('y',-10)
      //     .attr('width',50)
      //     .attr('height',15)
      //     .attr('fill','#d3d3d3');


      //   // Squares
      //   legend_group
      //     .selectAll('.legend-square')
      //     .data(legend_data)
      //     .enter()
      //     .append('rect')
      //     .attr('class',d=>`${d.type}-square`)
      //     .attr('x',280)
      //     .attr('y',(d,i)=> 0 + (i*23) )
      //     .attr('width',15)
      //     .attr('height',15)
      //     .style('transform','translateY(-7.5px)');
        
      //   // Text
      //   legend_group
      //     .selectAll('.legend-text')
      //     .data(legend_data)
      //     .enter()
      //     .append('text')
      //     .attr('class','legend-text')
      //     .attr('x',300)
      //     .attr('y',(d,i)=>0 + (i*23))
      //     .attr('dominant-baseline','middle')
      //     .text(d=>`${d.city}`); 



      // }



      // Set the data for the trial
      trialSetup(trial){
        // Set up colors
        this.predictor_color = trial.predictor_color;
        this.model_color = trial.model_color;
        // Add "1" to each month for use later
        //this.prediction_prompts = this.month_names.map(m=>`${m} 1`);
      }

      // Convert the text used for the month cutoffs (Jan 1) to labels (Jan-1)
      monthTextToId(prediction_text){
        return prediction_text.replaceAll(' ','-');
      }


      // Gets the values for the participant's estimates for each month and returns them as an object
      getResponseData(){
        let response_data = {};
        document.querySelectorAll('.text-input').forEach(e=>{
            response_data[e.id] = +e.value;
        })
        return response_data;
      }

      // Generate the 12 text boxes where participant's can enter their weather predictions for each month 
      generateTextInputHTML = function(){
        let form_html = '<div class = "predictions-wrapper"><form id = "response-form"><div class="text-wrapper"><div class = "text-inner-wrapper">';
        this.full_month_names.forEach((prompt_text,index)=>{
            form_html += `<div class = 'prediction-input'>${prompt_text}: 
            <input id='${this.monthTextToId(this.month_names[index])}' type='number' class="text-input" required disabled>
            <span class = 'suffix'>°F</span></div>`;
            if (index===5) form_html += '</div><div class = "text-inner-wrapper">';
        });
        form_html += '</div></div><input id="submit-button" class="jspsych-btn" type="submit" value="Submit responses"></form></div>';
        return form_html;
      }


      // Generate instructions for the participant's predictions
      generateInstructionsHTML(trial){
        const hint_text = this.getHintText(trial);
        const attention_check_text = trial.is_practice ? this.getAttentionCheckText() : '';
        return `<div class = 'instructions'>
          What do you think the average high temperature will be in 
          <span class = 'computer-number ${this.predictor_color}-text'>${trial.predictor_city}</span> 
          during these months next year? ${hint_text} ${attention_check_text}
        </div>`;
    }

      // Generate the HTML for the main title
      generateTitleHTML(trial){
        const practice_html = trial.is_practice ? 'Practice trial:<br>' : '';
        return `<div id='main-title'>
          ${practice_html}
          Predict the weather in 
          <span class = 'computer-number ${this.predictor_color}-text'>${trial.predictor_city}, ${trial.predictor_state}</span>
        </div>`;
      }

      // Generate the instructions for reading the model city plot (only displayed when there is model assistance)
      generateModelInstructionsHTML(){
        return `<div id = 'reference-text' class = 'instructions title'>
        For reference, here is is a model of the average monthly high temperature in 
        <span class = 'computer-number  ${this.model_color}-text'>${this.model_city}, ${this.model_state}</span>. 
        Move your mouse over the plot to see specific values.
        </div>`;
        //This is <b><i>not</i></b> the data for <span class = 'computer-number ${this.predictor_color}-text'>${trial.predictor_city}</span>, 
        //the city you are making predictions for!</p>`
      }

      // Generate the html for the plot (just instructions text and a wrapper that will be used for an svg later)
      generatePlotHTML(trial){
          const instructions_html = trial.model_assistance ? this.generateModelInstructionsHTML() : '';
          return `${instructions_html} <div id = 'model-svg-wrapper'></div>`;
      }

      // Generate all the HTML for the trial
      generateTrialHTML(trial){
          const title = this.generateTitleHTML(trial);
          const instructions = this.generateInstructionsHTML(trial);
          const text_input = this.generateTextInputHTML();
          const model_html = this.generatePlotHTML(trial);
          let trial_html = `<div id='initially-hidden'>
                              ${title}
                              <div id = 'content-wrapper'> 
                                <div id='flex-inner-1' class = 'flex-inner'>${model_html}</div>
                                <div id = 'flex-inner-2' class = 'flex-inner'>${instructions} ${text_input}</div>
                              </div>
                            </div>`;
          return trial_html;
      }

      // Returns T/F if all text input boxes have been filled out with numbers
      // Use to check whether to disable the submit button
      formReady(){
        for (let text_input of document.querySelectorAll('.text-input')){
          if (text_input.value==='') return false;
        }
        return true;
      }

      resize(trial){
        if (trial.model_assistance){
          this.hover_rect_left = document.getElementById('hover-rect').getBoundingClientRect().left;
        }
      }


      // Add event listeners to text-input boxes and submit button for trial functionality
      eventListeners(trial,display_element){

        // Setup submit event listener
        const response_form = document.getElementById('response-form');
        const that = this;

        // Finish trial on submit
        response_form.addEventListener('submit',function(e){
            document.getElementById('submit-button').disabled = true;
            e.preventDefault();
            that.finishModelTrial(trial,display_element);
        });

        // Disable button until ready to submit
        document.getElementById('submit-button').disabled = true;
        document.querySelectorAll('.text-input').forEach(e=>{
          e.addEventListener('focusout',function(){
            // Make user plot
            that.updateUserPointData(e.id);
            that.drawUserPoints();
            that.drawUserLine();
          })
          e.addEventListener('input',function(){
            // Restrict length of text inputs to 3 digits (3 digits + negative numbers)
            if (e.value.length > 3) e.value = e.value.slice(0, 3);

            // Toggle button disable
            const form_ready = that.formReady();
            if (form_ready !== that.form_ready){
              document.getElementById('submit-button').disabled = !form_ready;
              that.form_ready = form_ready;
            }
          })
        });

        // Call function when window is resized
        window.onresize = function(){that.resize(trial)};
        
        // Event listeners for tooltip hovers
        if (trial.model_assistance){
          const hover_rect = document.getElementById('hover-rect');
          this.hover_rect_left = hover_rect.getBoundingClientRect().left;
          hover_rect.addEventListener('mousemove',e=>{
            that.updateTooltip(e.clientX - that.hover_rect_left);
          })
  
          hover_rect.addEventListener('mouseleave',e=>{
            document.getElementById('tooltip').style.opacity = 0;
          })}
      }

      // Saves trial data and moves onto the next round
      finishModelTrial(trial,display_element){
        const end_time = new Date();
        const trial_duration = this.start_time - end_time;
        // data saving
        const trial_data = {
            responses: this.getResponseData(),
            model_city: this.model_city,
            model_state: this.model_state,
            model_latitude: +this.model_latitude,
            model_longitude: +this.model_longitude,
            model_cities: trial.model_cities,
            predictor_city: trial.predictor_city,
            predictor_state: trial.predictor_state,
            model_assistance:trial.model_assistance,
            type:trial.predictor_city_type,
            predictor_color: this.predictor_color,
            model_color: this.model_color,
            loading_time:this.loading_time,
            hitId:trial.hitId,
            workerId:trial.workerId,
            assignmentId:trial.assignmentId,
            condition:trial.condition,
            trial_num:trial.trial_num,
            all_experiment_data:false,
            start_time:this.start_time,
            end_time,
            trial_duration,
            is_practice:trial.is_practice,
            instruction_info: trial.instruction_info,
            trial_type:'temperature-prediction'
        };
        //end trial
        display_element.innerHTML = '';

        $.ajax({
          url: "https://mturk-function-app-node.azurewebsites.net/api/mturk-insert-response",
          //contentType: "application/json",
          type: "POST",
          //datatype: "json",
          data: JSON.stringify(trial_data),
          // success: function (data) {
          //   this.jsPsych.finishTrial(trial_data);
          // },
          // error: function (request, error) {
          //   this.jsPsych.finishTrial(trial_data);
          // }
        });
        this.jsPsych.finishTrial(trial_data);
      }

      // Generates text for the loading screen before trial presentation
      generateLoadingHTML(loading_str){
        return `<div id='loading-text'><div>Loading ${loading_str}...</div></div>`;
      }

      // Hide the loading text and show the trial
      startTrial(){
        document.getElementById('loading-text').remove();
        document.querySelectorAll('.text-input').forEach(e => {e.disabled = false})
        document.getElementById('initially-hidden').style.cssText =  `pointer-events:initial;opacity:1`;
      }

      generateCitiesText(trial){
        let html = `<div class = 'cities-text-wrapper'>`;
        for (let city of trial.model_cities){
          html += `<div id = '${this.spacesToUnderline(city.name)}-button' class = 'city-button city-selector'>${city.name}, ${city.state}</div>`;
            //html += `<div id = '${this.noSpaces(city.Name)}-text' class = 'city-selector'>${city.Name}, ${city.State}</div>`;
        }
        html += '</div>';
        return(html)
      }

      cityOnMousemove(element){
        // #eeeeee
        if (this.first_movement){
          const city = element.id.split('-')[0];
          d3.select(`#${city}-button`).classed("city-hover",true);
          const city_str = city.replaceAll("_"," ");
          // Make the hovered item on the top, clicked item the second one...
          this.svg.selectAll('.city-dot').sort( (a, b) =>{
            // Hover city always first
            if (a.name === city_str) return 1;
            // Model city always first except when comparator is hover city
            if (a.name === this.model_city & b.name !== city_str) return 1;
            // Everything else is indexed later
            return -1;
          });
          this.svg.select(`#${city}-dot`)
            .classed('city-dot-shown',true);
          this.first_movement = false;
        }
      }

      cityOnMouseleave(){
        this.svg.selectAll(`.city-dot`).classed('city-dot-shown',false);
        d3.selectAll(`.city-button`).classed("city-hover",false);
        this.first_movement = true;
      }

      cityOnClick(button_selectors,trial,element){
        const city_str = element.id.split('-')[0];
        // Upate button styling
        button_selectors.classed(`city-button-${trial.model_color}`,false);
        d3.select(`#${city_str}-button`).classed(`city-button-${trial.model_color}`,true);
        if (!this.city_selector_ready){
            document.getElementById('start-trial').disabled = false;
            this.city_selector_ready = true;
        }
        // Update city dot styling
        d3.selectAll(`.city-dot`).classed(`${trial.model_color}-city-dot-clicked`,false);
        d3.select(`#${city_str}-dot`).classed(`${trial.model_color}-city-dot-clicked`,true);
        // Save selected city
        const model_city = city_str.replaceAll('_',' ');
        this.model_city = model_city;
        const model_data = trial.model_cities.filter(d=>d.name === model_city)[0];
        this.model_state = model_data.state;
        this.model_latitude = model_data.latitude;
        this.model_longitude = model_data.longitude;
      }



      citySelectionHTMLEventListeners(display_element,trial){
        const city_buttons = d3.selectAll('.city-button');
        const that = this;
        d3.selectAll('.city-selector')
          .on('click', function() {that.cityOnClick(city_buttons,trial,this)})
          .on('mousemove', function() {that.cityOnMousemove(this)})
          .on('mouseout', function(){that.cityOnMouseleave()});

        d3.select('#start-trial').on('click',function(){
          that.showTrial(display_element,trial,'data');
        })
      }

      async showTrial(display_element,trial,loading_text){
        this.trialSetup(trial);
        const loading_html = this.generateLoadingHTML(loading_text);
        const trial_html = this.generateTrialHTML(trial);
        display_element.innerHTML = trial_html + loading_html;
        await this.makeCityPlot(trial);
        this.eventListeners(trial,display_element);
        setTimeout(()=>{
          this.startTrial();
        },trial.loading_time);
      }
0
      async drawUSAMap(trial){
        this.svg = d3.select("#cities-map-wrapper")
            .append('svg')
            .attr('width','100%')
            .attr('height','100%');

        const center_of_map = [-113.5, 46.5];
        const projection = d3.geoMercator()
            .center(center_of_map)
            .scale(465)                       
            .translate([200 / 2, 200 / 4])
        const geo_data = await d3.json('us-states.geojson')

        // Draw the map
        this.svg.append("g")
            .selectAll("path")
            .data(geo_data.features)
            .enter()
            .append("path")
            .attr("id", "usa-map")
            .attr("fill", "none")
            .attr("d", d3.geoPath()
                .projection(projection)
            )
            .style("stroke", "black");

            // Add the cities trial.model_
        this.svg.selectAll("circle")
          .data(model_cities)
          .enter()
          .append('circle')
          .attr('cx',d => projection([+d.longitude,+d.latitude])[0])
          .attr('cy',d => projection([+d.longitude,+d.latitude])[1])
          .attr('r',5)
          .attr('class',`city-selector city-dot ${trial.model_color}-city-dot`)
          .attr('id',d=>`${this.spacesToUnderline(d.name)}-dot`);
      }

      getHintText(trial){
        if (trial.is_practice || trial.instruction_info === false) return '';
        return `<br>Note: When it's summer north of the equator, it's winter south of the equator, and vice versa.`;
      }

      getAttentionCheckText(){
        return `<div id='attention-check'>Participants that are paying attention, please answer 99 to every question below.</div>`;
      }

      async generateCitySelectionHTML(display_element,trial){
        const cities_text = this.generateCitiesText(trial);
        //it can be useful to see predictions for cities with similar weather. You can see the predicted high temperatures  
        // Hint: A model for the city may be available below
        display_element.innerHTML = `
        <div class = 'hidden'>
          <div class = 'city-instructions'>
            <ul id = 'bullets'>
              <li>You will make predictions about average high temperatures in <span class = 'computer-number ${trial.predictor_color}-text'> 
                  ${trial.predictor_city},  ${trial.predictor_state}</span>
              </li>
              <li>
              To make your predictions, it can be useful to see predictions for cities with similar weather. 
              You can see the predicted average high temperatures for one of the following US cities while performing the task:
              </li>
            </ul>
          </div>
          <div id = "content-wrapper">
            ${cities_text}
            <div id = 'cities-map-wrapper'></div>
          </div>
          <button id='start-trial' class='jspsych-btn' disabled>Start trial</button>
        </div>`
        await this.drawUSAMap(trial);
        this.citySelectionHTMLEventListeners(display_element,trial);
        d3.select('.hidden').style("opacity",'1').style("pointer-events",'initial');
      }

      // Main function for setting up the trial
      async trial(display_element, trial) {
        this.start_time = new Date();
        if (trial.model_assistance){
          display_element.innerHTML = `<div id='loading-text'><div>Loading trial...</div></div>`
          setTimeout(()=>{
            this.generateCitySelectionHTML(display_element,trial);
          },trial.loading_time);
        } else{
          this.showTrial(display_element,trial,'trial');
        }
      }
    }
    
    PluginNamePlugin.info = info;
  
    return PluginNamePlugin;
  })(jsPsychModule);