# Context retrieval report

## Summary
- Covered labelled cases: 2
- Comparable retrieval hit-rate: 1/2
- Suburb-context hit-rate: 1/2
- Empty-result behavior: verified for a property with no matching comparables

## Notes
- The retrieval flow uses deterministic heuristics over the current gold tables.
- When no comparable matches are found, the system returns an empty comparable list rather than raising an exception.
