# Synthetic demo dataset

`city-demo.json` was authored for this prototype. No supplied official district dataset or official scoring weights were available. District names provide Astana context; populations, metrics, initiative costs, and impacts are invented. This is not a forecast or a claim about actual municipal performance.

Every user starts with 1,000 million KZT. All costs use million KZT. Metrics use 0–100, higher is better. Three initiatives per category expose cost/benefit and cross-category trade-offs. Districts starting below 50 receive two extra points of primary benefit. Impacts describe an illustrative single planning period, with no time-dependent dynamics.

Category scores are population-weighted district means when all populations are present and their sum is positive; otherwise every district has equal weight. AQoL is the equal mean of the five unrounded category averages. Displayed category scores, AQoL, and AQoL delta are rounded to one decimal. All impacts are summed before clamping metrics to 0–100. Invalid scenarios preserve the baseline and apply no impacts. Money is accounted for in integer tenge (one millionth of the displayed unit).

Demo A: transport-bus, greening-trees, social-clinics, safety-lighting, services-water (820 million KZT).
Demo B: transport-junctions, greening-parks, social-outreach, safety-community, services-waste (650 million KZT).
Overspend example: transport-rail, greening-parks, social-schools, safety-response, services-water (1,330 million KZT).
