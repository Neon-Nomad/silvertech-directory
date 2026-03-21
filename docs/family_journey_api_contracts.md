# Family Journey API Contracts (FAM-01 to FAM-05)

## Scope
These contracts define write/read semantics for family journey persistence.  
Outcome and attribution are intentionally separate.

## Common Write Envelope
- `facility_id` (uuid, required)
- `source` (`web|mobile|import`, required, default `web`)
- `session_id` (uuid, optional)
- `local_sequence` (integer >= 0, required for merge determinism)
- `idempotency_key` (uuid, required for `save|status|move_in|attribution`)

## Endpoints

### `POST /api/family/save`
Request:
```json
{
  "facility_id": "uuid",
  "source": "web",
  "session_id": "uuid",
  "local_sequence": 12,
  "idempotency_key": "uuid"
}
```
Response:
- `201` `{ "status": "saved" }`
- `200` `{ "status": "already_saved" }`

### `POST /api/family/status`
Request:
```json
{
  "facility_id": "uuid",
  "status": "touring",
  "previous_status": "researching",
  "source": "web",
  "session_id": "uuid",
  "local_sequence": 13,
  "idempotency_key": "uuid"
}
```
Rules:
- Append-only insert into `facility_status_history`.
- DB trigger enforces forward-only transitions and terminal lock after `moved_in`.

### `PUT /api/family/note`
Request:
```json
{
  "facility_id": "uuid",
  "content": "string",
  "source": "web",
  "session_id": "uuid",
  "local_sequence": 14
}
```
Rules:
- One active note per `(user_id, facility_id)` in MVP.
- Last-write-wins on merge.

### `POST /api/family/tour-log`
Request:
```json
{
  "facility_id": "uuid",
  "tour_at": "2026-04-03T14:00:00Z",
  "note": "optional",
  "source": "web",
  "session_id": "uuid",
  "local_sequence": 15
}
```

### `POST /api/family/move-in`
Request:
```json
{
  "facility_id": "uuid",
  "move_in_month": "2026-04-01",
  "source": "web",
  "session_id": "uuid",
  "local_sequence": 16,
  "idempotency_key": "uuid"
}
```
Response:
- `201` `{ "status": "moved_in_recorded" }`
- `200` `{ "status": "already_exists" }`

### `PUT /api/family/attribution`
Request:
```json
{
  "facility_id": "uuid",
  "attribution_type": "major",
  "source": "web",
  "session_id": "uuid",
  "local_sequence": 17,
  "idempotency_key": "uuid"
}
```
Rules:
- Upsert one row per `(user_id, facility_id)`.
- Optional and can be submitted later.

## Canonical Status Resolver
Use one source of truth only: `public.current_facility_status`.

```sql
SELECT DISTINCT ON (user_id, facility_id)
  user_id,
  facility_id,
  status,
  created_at
FROM facility_status_history
ORDER BY user_id, facility_id, created_at DESC, id DESC;
```

## Merge Rules (Unauth -> Auth)
Replay pending actions in deterministic order:
1. `created_at ASC`
2. `local_sequence ASC`

Canonical ordering expression: `sort by (created_at ASC, local_sequence ASC)`.

Deduping:
- `save`: ignore if already saved.
- `note`: last-write-wins.
- `status`: replay each transition with DB validation.
- `move_in`: ignore if row already exists.
- `attribution`: upsert latest choice.
