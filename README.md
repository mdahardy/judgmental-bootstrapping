# Bootstrapping project repo

This repo contains all the code to run the bootstrapping experiments and perform analyses on pilot data. It also contains pilot data and weather data used to create the temperature curves and evaluate participants' accuracy.

A brief description and overview of each directory:

* data_analysis/ contains the code analyzing the data from the experiments. A brief description of the most relevant scripts:
    * power_analysis.R is the script for running the power analysis. Cached power analyses (data on the number of participants and estimated power) can be found the in the cached_power_analyses/ directory.
    * final_prereg.R runs all of the pre-registered statistical tests on the given experiment data
    * bootstrapping-ridge.Rmd fits a 4th-degree polynomial ridge regression model to every trial and plots the results.
    * final_main_plots.Rmd generates useful plots of the results we may want to use in the paper.
    * ability_anlaysis.Rmd estimates each participant's ability using an IRT model and plots the relationship between estimated ability and other outcomes.
    * interpolation-analyses.Rmd plots the effects of bootstrapping via simple interpolation which we may want to do a follow-up paper on.
    * multi-choice-utils.R contains helper functions used in all of the analysis scripts.
* experiment/ contains all the front-end code and data for running the experiment. The current experiment is deployed at https://mdahardy.github.io/judgmental-bootstrapping/experiment.
    * city_data.csv contains data for identifying and selecting the target cities.
    * experiment_with_city_selection.js is the main experiment script that generates and organizes the experiment using the jsPysch library.
    * model_trial_with_selection.js is a custom jsPsych plugin that generates each trial (either control or model assistance).
    * us-states.geojson contains data for drawing the state outlines in the USA map at the start of model-assistance trials.
    * custom.css and index.html are pretty self-explanatory.
* experiment_data/ contains the prediction and worker data from each pilot. Prediction data records participants' behavior on each trial, whereas worker data stores their responses to the comprehension test and other post-experiment questions. Note that this directory has its own README giving details on each pilot we ran.
* monthly_averages/ contains data on the average monthly high and low temperatures for each model and target city.
* old/ contains old files not currently in use. This is divded into two directories:
     * old_front_end/ contains old front end code for the experiment (for example, when New York was always the model city)
     * old scripts/ contains old scripts we used to generate historical weather data.
* presentations_and_docs/ contains powerpoint presentations and our pre-registration word document.