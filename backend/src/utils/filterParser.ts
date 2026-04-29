export type FieldType = 'string' | 'number' | 'boolean' | 'date';

export interface ParseOptions {
  allowedFields?: string[]; // whitelist fields that can be queried
  fieldTypes?: Record<string, FieldType>;
  defaultSearchFields?: string[]; // when a plain text query is provided
  defaultDeleted?: boolean; // whether to add deleted:false by default
}

export function parseFilterString(q?: string, opts: ParseOptions = {}) {
  const {
    allowedFields,
    fieldTypes = {},
    defaultSearchFields = ['name', 'email'],
    defaultDeleted = true,
  } = opts;

  if (!q || q.trim() === '') {
    return defaultDeleted ? { deleted: false } : {};
  }

  const isFilterExpr = q.includes('=') || q.includes('==');

  // plain text search -> build OR on defaultSearchFields
  if (!isFilterExpr) {
    const term = q.trim();
    const ors: any[] = [];
    for (const f of defaultSearchFields) {
      if (allowedFields && !allowedFields.includes(f)) continue;
      ors.push({ [f]: { contains: term, mode: 'insensitive' } });
    }
    const where: any =
      ors.length > 0
        ? { OR: ors }
        : { name: { contains: term, mode: 'insensitive' } };
    if (defaultDeleted && where.deleted === undefined) where.deleted = false;
    return where;
  }

  const parts = q
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  const andClauses: any[] = [];

  for (const part of parts) {
    const m = part.match(/^([^=<>!]+)(==|=|!=)(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const op = m[2];
    let raw = m[3].trim();

    if (allowedFields && !allowedFields.includes(key)) continue;

    // coerce types if provided
    const t = fieldTypes[key];
    let value: any = raw;
    if (t === 'boolean') {
      value = /^true$/i.test(raw);
    } else if (t === 'number') {
      const n = Number(raw);
      if (!Number.isNaN(n)) value = n;
    } else if (t === 'date') {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) value = d;
    }

    // build clause
    if (t === 'string' || typeof value === 'string') {
      // use contains for equality for usability
      if (op === '!=') {
        andClauses.push({
          NOT: { [key]: { contains: value, mode: 'insensitive' } },
        });
      } else {
        andClauses.push({ [key]: { contains: value, mode: 'insensitive' } });
      }
    } else {
      // number/boolean/date exact matches
      if (op === '!=') {
        andClauses.push({ NOT: { [key]: value } });
      } else {
        andClauses.push({ [key]: value });
      }
    }
  }

  const where: any =
    andClauses.length === 1 ? andClauses[0] : { AND: andClauses };
  if (defaultDeleted && where.deleted === undefined) where.deleted = false;
  return where;
}

export default parseFilterString;
