const matchSchema = new normalizr.schema.Entity(
  'Match',
  { },
  { idAttribute: 'eventId' }
)
const matchListSchema = new normalizr.schema.Array(matchSchema)
const matchListValuesSchema = new normalizr.schema.Values(matchListSchema)
