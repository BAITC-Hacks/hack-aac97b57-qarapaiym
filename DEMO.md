# 60–90 second judge demo

1. Open the app. Show the common 1,000 million KZT budget and AQoL baseline of 53.2. The submit button is disabled until all five categories have choices.
2. Choose scenario A: `transport-bus`, `greening-trees`, `social-clinics`, `safety-lighting`, `services-water`. Show 820 spent and 180 remaining.
3. Click **Simulate my city**. Show AQoL 64.6, change +11.4, category bars, and district details. Save as scenario A.
4. With an API key configured, show the AI summary, strengths, risks, trade offs, and recommendations. Without a key, show the configuration error and the still visible deterministic results.
5. Choose scenario B: `transport-junctions`, `greening-parks`, `social-outreach`, `safety-community`, `services-waste`. Run again. Show 650 spent, 350 remaining, AQoL 64.0, change +10.8, and the comparison against A.
6. Demonstrate the budget guard using `transport-rail`, `greening-parks`, `social-schools`, `safety-response`, `services-water`. This combination costs 1,330 million KZT; the UI disables a choice that would exceed the budget. Reset or reload to return to the common start.

The score and budget come from code and bundled synthetic data. AI only explains a valid calculated result. Live AI success requires a working server side OpenAI key; mocked tests do not verify provider availability.
