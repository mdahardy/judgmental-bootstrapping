## Replication package for "Improving out-of-population prediction: The complementary effects of model assistance and judgmental bootstrapping"

This repo contains analysis code, experiment code, and data for <b>Improving out-of-population prediction: The complementary effects of model assistance and judgmental bootstrapping</b> by [Matt Hardy](https://matthardy.org/), [Sam Zhang](https://sam.zhang.fyi/), [Jessica Hullman](http://users.eecs.northwestern.edu/~jhullman/), [Jake Hofman](http://jakehofman.com/), and [Dan Goldstein](http://www.dangoldstein.com/).

This reproducibility package was assembled on September 9th, 2024. For questions, contact Matt Hardy at [mdhardy@princeton.edu](mailto:mdhardy@princeton.edu).

### Contents

#### Scripts

The [data_analysis](data_analysis/) directory contains the following R Markdown files:

* [experiment_results.Rmd](experiment_results.Rmd): Runs all the statistical tests cited in the paper. Our main analyses and sample sizes were [preregistered](https://aspredicted.org/blind.php?x=36R_4GW). The results of each analysis (H1-H4) are printed in the final code block. Runtime: ~30 seconds.
* [final_experiment_figures.Rmd](final_experiment_figures.Rmd): Generates the plots included in the paper. Runtime: ~60 seconds.
* [multi-choice-utils.R](multi-choice-utils.R): Contains helper functions used in the analysis scripts (regular R script).

#### Data

The [experiment_data/](experiment_data/) directory contains:

* [raw_experiment_data.csv](experiment_data/raw_experiment_data.csv): Raw experiment data
* [experiment_data_with_bootstrap.csv](experiment_data/experiment_data_with_bootstrap.csv): Experiment data with fitted bootstrapped estimates
* [worker_data.csv](experiment_data/worker_data.csv): Participants' responses to the comprehension quiz
* [monthly_averages/](experiment_data/monthly_averages/): True high temperatures for target and model cities

#### Experiment Code

The [experiment/](experiment/) directory contains the front-end code and data for running the experiment. A demo is available [here](https://mdahardy.github.io/judgmental-bootstrapping-internal/experiment).

Key files:
* [experiment_with_city_selection.js](experiment/experiment_with_city_selection.js): Main experiment script (jsPsych)
* [model_trial_with_selection.js](experiment/model_trial_with_selection.js): Custom jsPsych plugin for trials
* [city_data.csv](experiment/city_data.csv): Data for target city selection
* [us-states.geojson](experiment/us-states.geojson): Data for USA map state outlines
* [custom.css](experiment/custom.css) and [index.html](experiment/index.html): Styling and main HTML file
* [comprehension_questions.pdf](experiment/comprehension_questions.pdf): Comprehension quiz questions and answers

Note: To run the experiment locally, launch a server in the experiment directory.

### Setup and Reproduction

To run the analyses:

1. Ensure you have R (version 4.0.0 or later) and RStudio installed.
2. Clone or download this repository.
3. Install required packages:
   ```r
   install.packages("remotes")
   
   packages <- c("dplyr", "emmeans", "lme4", "lmerTest", "here", "ltm", "glmnet", "ggplot2", "stringi", "lubridate", "ggpattern", "tidyr")
   versions <- c("1.0.8", "1.8.1.1", "1.1.28", "3.1.3", "1.0.1", "1.2.0", "4.1.4", "3.4.4", "1.7.6", "1.8.0", "1.0.1", "1.2.0")
   
   for (i in seq_along(packages)) {
     remotes::install_version(packages[i], version = versions[i])
   }
   ```
4. Open the desired .Rmd file in RStudio.
5. Click "Knit" to run the analysis and generate the output document.

Each R Markdown file will:
1. Load required packages
2. Set up the working environment using the `here` package
3. Source 'multi-choice-utils.R' for additional functions
4. Perform analyses or generate figures