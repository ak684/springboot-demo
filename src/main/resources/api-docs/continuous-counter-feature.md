# Continuous Counter Feature API Documentation

## Overview
The continuous counter feature allows aggregated indicators with prorated time periods (YTD, MTD, today, since inception) to display as real-time incrementing values on dashboards.

## API Response
When an indicator has `continuous_counter` enabled and uses a prorated time period, the public API response will include additional continuous counter data:

```json
{
  "indicator_name_en": "Families Housed YTD",
  "indicator_value": 584.93,
  "continuous_counter": {
    "annual_total": 1100,
    "daily_rate": 3.0137,
    "hourly_rate": 0.1256,
    "rate_per_second": 0.0000349,
    "base_value_midnight": 584.00,
    "last_updated": "2025-06-29T10:30:00"
  }
}
```

## Fields Description
Note: The presence of the `continuous_counter` object indicates the feature is active. If not enabled, this object will be absent from the response.

- **annual_total**: The projected total for the full year
- **daily_rate**: Average value increment per day
- **hourly_rate**: Average value increment per hour
- **rate_per_second**: Average value increment per second
- **base_value_midnight**: The calculated value at midnight (start of current day)
- **last_updated**: Timestamp of when the rates were calculated

## Usage
Frontend applications can use these rates to display a real-time incrementing counter:
1. Start with the `indicator_value` or `base_value_midnight`
2. Add `rate_per_second * elapsed_seconds` since the last update
3. Update the display every second or at desired intervals

## Limitations
- Only available for indicators with prorated time periods (YTD, MTD, today, since inception)
- Rates are calculated assuming uniform distribution throughout the time period
- Does not account for business days or seasonal variations
- Since inception assumes 10 years of operation and uses average yearly growth for projections
