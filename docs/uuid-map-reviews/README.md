# UUID map review records

Each file here is the review record for one promotion of `data/facility-uuid-map.tsv`. The format and the rules are in [docs/uuid-map-maintenance.md](../uuid-map-maintenance.md).

One line per approved identity change:

```
<canonical path><TAB><reviewer><TAB><reason, with the evidence>
```

Name files by date and topic, for example `2026-11-09-new-listings.tsv`. Commit each review file with the map it approved. Do not edit a review file after its map has been promoted.
