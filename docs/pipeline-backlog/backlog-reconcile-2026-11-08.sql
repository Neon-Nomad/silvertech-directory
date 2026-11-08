-- Read-only. Run in the production SQL Editor before and after each supervised backlog run.
-- Pair it with B0-batch-counts.sql. Compare the two outputs with the run summary and the stop conditions in the runbook.
select 'running_runs' as metric, count(*)::text as value
from public.normalization_runs
where status = 'running'
union all
select 'run ' || r.started_at::text,
       coalesce(r.status, '-')
         || ' scanned=' || coalesce(r.records_scanned::text, '-')
         || ' normalized=' || coalesce(r.records_normalized::text, '-')
         || ' rejected=' || coalesce(r.records_rejected::text, '-')
         || ' batches=' || coalesce(r.metadata->>'batches', '-')
         || ' stop=' || coalesce(r.metadata->>'stop_reason', '-')
         || ' duplicates=' || coalesce(r.metadata->>'duplicates', '-')
         || ' transient=' || coalesce(r.metadata->>'transient', '-')
         || ' rejection_write_failed=' || coalesce(r.metadata->>'rejection_write_failed', '-')
from (
  select * from public.normalization_runs order by started_at desc limit 10
) r
order by 1 desc;
