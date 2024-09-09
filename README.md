## Replication package for "Improving out-of-population prediction: The complementary effects of model assistance and judgmental bootstrapping"

This repo contains analysis code, experiment code, and data for <b>Improving out-of-population prediction: The complementary effects of model assistance and judgmental bootstrapping</b> by [Matt Hardy](https://matthardy.org/), [Sam Zhang](https://sam.zhang.fyi/), [Jessica Hullman](http://users.eecs.northwestern.edu/~jhullman/), [Jake Hofman](http://jakehofman.com/), and [Dan Goldstein](http://www.dangoldstein.com/).

This reproducibility package was assembled on September 9th, 2024. For questions, contact Matt Hardy at [mdhardy@princeton.edu](mailto:mdhardy@princeton.edu).

### Scripts

The [data_analysis](data_analysis/) directory contains the code for analyzing the experiment data and producing the plots. The scripts are R Markdown files that automatically install the relevant packages and versions if needed. TheA description of each script is given below.
* [experiment_results.Rmd](experiment_results.Rmd): Runs all the statistical tests cited in the paper. Our main analyses and sample sizes were [preregistered](https://aspredicted.org/blind.php?x=36R_4GW) before running the main experiment. The results of each analysis (H1-H4) are printed in the document in the final code block. The code should take under 30 seconds to run on most machines.
* [final_experiment_figures.Rmd](final_experiment_figures.Rmd): Generates the plots included in the paper. These plots are displayed within the knitted document. The code should take under 60 seconds to run on most machines.
* [multi-choice-utils.R](multi-choice-utils.R): Contains helper functions used in the analysis scripts. This is a regular R script, not an R Markdown file.

Each R Markdown file (.Rmd) includes code to:
1. Install and load required packages with specific versions
2. Set up the working environment using the `here` package
3. Source the 'multi-choice-utils.R' script for additional functions
4. Perform the relevant analyses or generate figures

To reproduce the analyses:
1. Open the desired .Rmd file in RStudio
2. Ensure you have R and RStudio installed
3. Click "Knit" to run the entire analysis and generate the output document

### Data

The [experiment_data/](experiment_data/) directory contains the final data from the experiment. A description of each file is given below.
* [raw_experiment_data.csv](experiment_data/raw_experiment_data.csv) contains the raw experiment data from the experiment.
* [experiment_data_with_bootstrap.csv](experiment_data/experiment_data_with_bootstrap.csv) contains the experiment data with the fitted bootstrapped estimates appended as an additional column.
* [worker_data.csv](experiment_data/worker_data.csv) contains each participant's responses to the comprehension quiz.
* The [experiment_data/monthly_averages/](experiment_data/monthly_averages/) directory includes the true high temperatures for every target and model city (this is used to estimate errors).

### Experiment code

The [experiment/](experiment/) directory contains all the front-end code and data for running the experiment (including the comprehension quiz).  You can view a demo of the experiment [here](https://mdahardy.github.io/judgmental-bootstrapping-internal/experiment). A description of each file is given below.
* [experiment_with_city_selection.js](experiment/experiment_with_city_selection.js) is the main experiment script that generates and organizes the experiment using the jsPysch library.
* [model_trial_with_selection.js](experiment/model_trial_with_selection.js) is a custom jsPsych plugin that generates each trial (either control or model assistance).
* [city_data.csv](experiment/city_data.csv) contains data for identifying and selecting the target cities.
* [us-states.geojson](experiment/us-states.geojson) contains data for drawing the state outlines in the USA map at the start of model-assistance trials.
* [custom.css](experiment/custom.css) and [index.html](experiment/index.html) are self-explanatory (note: you will have to launch a server in this directory to run the experiment locally).
* [comprehension_questions.pdf](experiment/comprehension_questions.pdf) contains all the questions, options, and correct responses for the comprehension quiz used at the end of the experiment.