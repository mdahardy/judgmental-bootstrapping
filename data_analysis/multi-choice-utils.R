
# -- -- -- -- -- -- -- #
# --HELPER FUNCTIONS -- -- -# 
# -- -- -- -- -- -- -- #

get_city_averages = function(cities){
  relevant_city_data = data.frame()
  for (city in cities){
    city_str= gsub(' ', '_', city)
    if (city_str=='New_York_City') city_str = 'New_York'
    city_data = paste0('experiment_data/monthly_averages/',city_str,'.csv') %>%
      here() %>%
      read.csv() %>%
      transmute(
        city,
        month,
        average_hi,
        average_lo
      )
    relevant_city_data = rbind(relevant_city_data,city_data)
  }
  return(relevant_city_data)
}

merge_experiment_truth = function(exp_data,true_data){
  return(
    exp_data %>%
      merge(true_data,
            by.x=c('predictor_city','month'),
            by.y=c('city','month')) %>%
      mutate(
        error = average_hi - temperature_estimate,
        abs_error = abs(average_hi - temperature_estimate),
        squared_error = (average_hi - temperature_estimate)^2
      )
  )
}

# Function for standard error
se = function(x,n){
  return(sd(x)/sqrt(n))
}


load_experiment_data = function(hit_id_list){
  experiment_data = load_experiments(hit_id_list)
  target_cities = unique(experiment_data$predictor_city)
  city_averages = get_city_averages(target_cities)
  # Merge experiment_data and city_averages
  experiment_data %>%
    merge_experiment_truth(city_averages) %>%
    #get_model_error(city_averages) %>%
    return()
}


load_experiments = function(hit_id_list){
  months = c("Jan","Feb","Mar","Apr","May","June","July","Aug","Sep","Oct","Nov","Dec")
  pilot = 1
  all_data = data.frame()
  for (experiment in hit_id_list){
    experiment_data = '../experiment_data/' %>%
      paste0(experiment) %>%
      paste0('/predictions.csv') %>%
      read.csv() %>%
      mutate(
        pilot,
        month = match(month,months)
      )
    # # Only get participants who completed all trials
    # # This will be the max of trial_num - different pilots
    # # have different numbers of trials
    # num_trials_by_worker = experiment_data %>%
    #   group_by(workerId_hash) %>%
    #   summarize(n=n())
    # completed_all_trials = num_trials_by_worker %>%
    #   subset(n == max(experiment_data$trial_num)*12)
    # experiment_data = experiment_data %>%
    #   subset(workerId_hash %in% completed_all_trials$workerId_has
    all_data = bind_rows(experiment_data,all_data)
    
    pilot = pilot + 1
  }
  return(all_data)
}

# -- -- -- -- -- -- -- -- -- -- -- --
# -- -- -- -- -- -- -- -- -- -- -- --
# Helper function for model city errors
# -- -- -- -- -- -- -- -- -- -- -- --
# -- -- -- -- -- -- -- -- -- -- -- --

get_model_predicted_highs = function(df){
  df %>%
    group_by(city) %>%
    summarize(
      model_predicted_hi = round(fitted(lm(average_hi ~ poly(month, 4)),.groups='drop'))
    ) %>% 
    mutate(
      month = row_number()
    ) %>%
    return()
}


# Adds the error from the chosen model cities to experiment_data
add_errors_from_chosen_models = function(input_data){
  chosen_model_cities = unique(input_data$model_city)
  # Remove empty string
  chosen_model_cities = chosen_model_cities[nzchar(chosen_model_cities)]
  # Get monthly averages from every model city
  model_city_averages = get_city_averages(chosen_model_cities)
  
  # Add error from chosen model cities to input_data and return
  model_city_averages %>%
    get_model_predicted_highs() %>%
    right_join(model_city_averages,by=c('city','month')) %>%
    ungroup() %>%
    transmute(
      model_city = city,
      month,
      model_predicted_hi
    ) %>%
    right_join(input_data,by=c('model_city','month')) %>%
    mutate(
      chosen_model_abs_error = abs(model_predicted_hi - average_hi)
    ) %>%
    return()
}

# Gets the mode of some vector v
getmode = function(v) {
  uniqv = unique(v)
  uniqv[which.max(tabulate(match(v, uniqv)))]
}


# Gets the most popular model city for every predictor city
# along with the temperatures for that city
get_most_popular_model_cities = function(input_data){
  model_city_modeled_highs = unique(subset(input_data,model_assistance == 'True')$model_city) %>%
    get_city_averages() %>%
    get_model_predicted_highs()
  # Get most chosen predictor city for every target city
  input_data %>%
    subset(model_assistance == 'True') %>%
    group_by(predictor_city) %>% 
    summarize(
      most_popular_model = getmode(model_city)
    ) %>%
    transmute(
      predictor_city,
      city = most_popular_model
    ) %>%
    left_join(model_city_modeled_highs) %>%
    transmute(
      most_popular_model_city = city,
      predictor_city,
      month,
      model_city_modeled_high = model_predicted_hi
    ) %>%
    return()
}

# For every predictor_city, gets best model city
# along with the temperatures for that city
get_best_model_cities = function(input_data){
  # Model city average temperatures
  model_cities = unique(subset(input_data,model_assistance=='True')$model_city)
  model_city_temperatures = get_city_averages(model_cities)
  
  model_city_modeled_highs = get_model_predicted_highs(model_city_temperatures) 
  
  # Predictor city average temperatures
  predictor_cities = unique(subset(input_data,model_assistance=='True')$predictor_city)
  predictor_city_temperatures = get_city_averages(predictor_cities)
  
  month = 1:12
  
  # Generate df for merging
  city_combos = expand.grid(model_cities,predictor_cities,month) %>%
    transmute(
      model_city = Var1,
      predictor_city = Var2,
      month = Var3
    )
  
  # Add model city highs
  city_combos = model_city_modeled_highs%>%
    transmute(
      model_city = city,
      month,
      model_predicted_hi = model_predicted_hi
    ) %>%
    merge(city_combos,by=c('model_city','month'))
  
  # Add predictor city highs
  city_combos = predictor_city_temperatures %>%
    transmute(
      predictor_city = city,
      month,
      predictor_average_hi = average_hi
    ) %>%
    merge(city_combos,by=c('predictor_city','month'))
  
  # Get error for each model city and select the model city with the lowest error
  # for each predictor city
  model_city_errors = city_combos %>%
    mutate(
      model_city_error = abs(model_predicted_hi -predictor_average_hi),
    ) %>%
    group_by(predictor_city,model_city) %>%
    summarize(
      average_model_city_error = mean(model_city_error)
    ) %>%
    group_by(predictor_city) %>%
    summarize(
      best_model_city_error = min(average_model_city_error),
      best_model_city = model_city[which.min(average_model_city_error)]
    )
  
  # Get the average highs for the best model city 
  best_model_city_highs = model_city_modeled_highs %>%
    dplyr::select(
      best_model_city = city,
      best_model_predicted_hi = model_predicted_hi,
      month
    ) %>%
    merge(model_city_errors,by = 'best_model_city')
  
  return(best_model_city_highs)

}

# Adds best model cities to expeirment_dat 
add_best_model_city_errors = function(input_data,best_model_city_df){
  best_model_city_df %>%
    merge(input_data,by=c("month","predictor_city")) %>%
    mutate(
      best_model_abs_error = ifelse(model_assistance == "True",abs(best_model_predicted_hi - average_hi),NA)
    ) %>%
    return()
}


# Function that adds column on whether participants fail the berlin trial attention check
identify_junk = function(input_data){
  if (!'Berlin' %in% unique(input_data$predictor_city)){
    stop('To exclude junk there must be a Berlin trial!')
  }
  
  # Excluded if max-min < diff_too_low or > diff_too_hi  
  diff_too_low = 2
  diff_too_hi = 100
  
  # Only included if min_estimate > min_min and max_estimate < max_max
  min_min = 0
  max_max = 120
  
  # Excluded if mean error geq max_mean_error
  max_mean_error = 50
  
  workers_passed_check = input_data %>%
    subset(predictor_city == 'Berlin') %>%
    group_by(workerId_hash) %>%
    summarize(
      # Summer hottest, winter coldest
      jan_hi = temperature_estimate[month==1],
      july_hi = temperature_estimate[month==7],
      months_ok = july_hi > jan_hi,
      # Variance too high or too low
      difference = max(temperature_estimate) - min(temperature_estimate),
      variance_ok = !(difference < diff_too_low || difference > diff_too_hi),
      # Absolute maxes and mins off
      min_hi = min(temperature_estimate),
      max_hi = max(temperature_estimate),
      absolute_ok = (min_hi >= min_min) && (max_hi <= max_max),
      # Average error
      error_ok = mean(abs_error) < max_mean_error,
      passed_check = months_ok &&
        variance_ok &&
        absolute_ok &&
        error_ok
    ) %>%
    # For cleaner merging with experiment_data
    transmute(
      workerId_hash,
      months_ok,
      variance_ok,
      absolute_ok,
      error_ok,
      passed_check
    )

  new_input_data = input_data %>%
    merge(workers_passed_check,by='workerId_hash') %>%
    return()
}

threshold_estimates = function(input_data){
  input_data %>%
    mutate(
      temperature_estimate = pmin(temperature_estimate,120),
      temperature_estimate = pmax(temperature_estimate,0),
      abs_error = abs(temperature_estimate - average_hi)
    ) %>%
    return()
}



# Fits bootstrap to original data
fit_bootstrap_model_and_make_predictions = function(curr_data,max_order,trial_i){
  print(paste("Fitting bootstrap estimates on trial",trial_i))
  x = model.matrix(adjusted_temperature_estimate ~ poly(month,max_order),data=curr_data)
  y = curr_data$adjusted_temperature_estimate
  cross_validations = cv.glmnet(x, y, alpha = 0, nfolds=12, grouped=F)
  predictions = predict(cross_validations,s=cross_validations$lambda.1se,newx=x)
  outcomes = data.frame(
    month = 1:12,
    trial_id = trial_i,
    bootstrap_prediction = as.vector(predictions)
  )
  return(outcomes)
}

add_bootstrapping_estimates = function(experiment_data,max_order,refit_bootstraps){
  
  if (!refit_bootstraps){
    return(read.csv('../experiment_data/experiment_data_with_bootstrap.csv'))
  }
  
  all_predictions = data.frame()
  # Fit separate bootstrap model for each trial_id
  for (trial_i in unique(experiment_data$trial_id)){
    curr_predictions = experiment_data %>%
      subset(trial_id == trial_i) %>%
      arrange(month) %>%
      fit_bootstrap_model_and_make_predictions(max_order,trial_i)
    all_predictions = rbind(all_predictions,curr_predictions)
  }
  
  all_predictions_mutated = all_predictions %>%
     mutate( 
       bootstrap_prediction = pmin(bootstrap_prediction,120),
       bootstrap_prediction = pmax(bootstrap_prediction,0),
       bootstrap_prediction = round(bootstrap_prediction))
  
  new_experiment_data = experiment_data %>%
    merge(all_predictions_mutated,by=c("month","trial_id")) %>%
    transmute(
      average_hi,
      bootstrap_prediction,
      temperature_estimate,
      bootstrap_error = abs(bootstrap_prediction - average_hi),
      human_minus_bootstrap_error = abs_error - bootstrap_error,
      abs_error,
      type,
      trial_id,
      condition,
      month,
      workerId_hash,
      predictor_city,
      model_assistance,
      model_city
    )
  
  write.csv(new_experiment_data,'../experiment_data/experiment_data_with_bootstrap.csv')

  return(new_experiment_data)
}



load_experiment_data2 = function(hit_id_list){
  experiment_data = load_experiments(hit_id_list)
  return (experiment_data)
}
