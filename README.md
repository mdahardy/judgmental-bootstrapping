# Model assistance and judgmental bootstrapping

This repo contains analysis code, experiment code, and data for <b>The complementary effects of model assistance and judgmental bootstrapping for out-of-population prediction</b> by [Matt Hardy](https://matthardy.org/), [Sam Zhang](https://sam.zhang.fyi/), [Jessica Hullman](http://users.eecs.northwestern.edu/~jhullman/), [Jake Hofman](http://jakehofman.com/), and [Dan Goldstein](http://www.dangoldstein.com/).

A brief description and overview of the repo is given below>

* data_analysis/ contains the code analyzing the data from the experiments. A brief description of the most relevant scripts:
    * experiment_results.Rmd runs all the statistical tests cited in the paper. Our main analyses and sample sizes were [preregistered](https://aspredicted.org/blind.php?x=36R_4GW) before running the main experiment.
    * final_experiment_figures.Rmd generates the plots included in the paper.
    * multi-choice-utils.R contains helper functions used in all of the analysis scripts.
* experiment/ contains all the front-end code and data for running the experiment. You can view a demo of the experiment [here](https://mdahardy.github.io/judgmental-bootstrapping/experiment).
    * city_data.csv contains data for identifying and selecting the target cities.
    * experiment_with_city_selection.js is the main experiment script that generates and organizes the experiment using the jsPysch library.
    * model_trial_with_selection.js is a custom jsPsych plugin that generates each trial (either control or model assistance).
    * us-states.geojson contains data for drawing the state outlines in the USA map at the start of model-assistance trials.
    * custom.css and index.html are self-explanatory (note: you will have to launch a server in this directory to run the experiment locally).
    * comprehension_questions.pdf contains all the questions, options, and correct responses for the comprehension quiz used at the end of the experiment. 
* experiment_data/ contains the final data from the experiment.
    * raw_experiment_data.csv contains the raw experiment data from the experiment.
    * experiment_data_with_bootstrap.csv contains the experiment data with the fitted bootstrapped estimates appended as an additional column.
    * the monthly_averages/ directory includes the true high temperatures for every target and model city.