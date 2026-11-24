export interface SqlRow {
  [key: string]: string | number;
}

export interface SqlTableSchema {
  name: 'students' | 'courses' | 'results';
  columns: string[];
  primaryKey: string;
  foreignKeys?: string[];
  rows: SqlRow[];
}

export const SAMPLE_TABLES: Record<'students' | 'courses' | 'results', SqlTableSchema> = {
  students: {
    name: 'students',
    columns: ['id', 'name', 'city', 'grade', 'track'],
    primaryKey: 'id',
    rows: [
      { id: 1, name: 'Aibek', city: 'Astana', grade: 92, track: 'CS' },
      { id: 2, name: 'Dana', city: 'Almaty', grade: 88, track: 'CS' },
      { id: 3, name: 'Timur', city: 'Shymkent', grade: 74, track: 'Math' },
      { id: 4, name: 'Madina', city: 'Astana', grade: 96, track: 'CS' },
      { id: 5, name: 'Nurlan', city: 'Almaty', grade: 81, track: 'Physics' },
      { id: 6, name: 'Aruzhan', city: 'Karaganda', grade: 95, track: 'CS' },
    ],
  },
  courses: {
    name: 'courses',
    columns: ['id', 'title', 'module_code', 'credits'],
    primaryKey: 'id',
    rows: [
      { id: 101, title: 'Binary Systems', module_code: 'M01', credits: 4 },
      { id: 102, title: 'Python Core', module_code: 'M04', credits: 6 },
      { id: 103, title: 'SQL Databases', module_code: 'M05', credits: 5 },
      { id: 104, title: 'Network Security', module_code: 'M06', credits: 4 },
    ],
  },
  results: {
    name: 'results',
    columns: ['id', 'student_id', 'course_id', 'score'],
    primaryKey: 'id',
    foreignKeys: ['student_id -> students.id', 'course_id -> courses.id'],
    rows: [
      { id: 1, student_id: 1, course_id: 102, score: 90 },
      { id: 2, student_id: 1, course_id: 103, score: 94 },
      { id: 3, student_id: 2, course_id: 102, score: 85 },
      { id: 4, student_id: 3, course_id: 101, score: 72 },
      { id: 5, student_id: 4, course_id: 103, score: 98 },
      { id: 6, student_id: 5, course_id: 104, score: 79 },
      { id: 7, student_id: 6, course_id: 102, score: 96 },
      { id: 8, student_id: 4, course_id: 102, score: 95 },
    ],
  },
};

export interface SqlExecutionResult {
  ok: boolean;
  columns: string[];
  rows: SqlRow[];
  message?: string;
  affectedCount?: number;
}

function parseValue(token: string): string | number {
  const trimmed = token.trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  const num = Number(trimmed);
  if (!Number.isNaN(num) && trimmed !== '') {
    return num;
  }
  return trimmed;
}

function getColValue(row: SqlRow, colName: string): string | number | undefined {
  const clean = colName.includes('.') ? colName.split('.').pop()! : colName;
  if (colName in row) return row[colName];
  if (clean in row) return row[clean];
  const lower = clean.toLowerCase();
  for (const k of Object.keys(row)) {
    if (k.toLowerCase() === lower) return row[k];
  }
  return undefined;
}

function evalCondition(row: SqlRow, condStr: string): boolean {
  const partsAnd = condStr.split(/\s+AND\s+/i);
  return partsAnd.every((part) => {
    const partsOr = part.split(/\s+OR\s+/i);
    return partsOr.some((clause) => {
      const m = clause.trim().match(/^([\w.]+)\s*(=|!=|<>|>=|<=|>|<)\s*(.+)$/);
      if (!m) return true;
      const [, field, op, rawVal] = m;
      const actual = getColValue(row, field);
      const expected = parseValue(rawVal);
      if (actual === undefined) return false;

      if (typeof actual === 'number' && typeof expected === 'number') {
        switch (op) {
          case '=':
            return actual === expected;
          case '!=':
          case '<>':
            return actual !== expected;
          case '>':
            return actual > expected;
          case '<':
            return actual < expected;
          case '>=':
            return actual >= expected;
          case '<=':
            return actual <= expected;
        }
      }

      const aStr = String(actual).toLowerCase();
      const eStr = String(expected).toLowerCase();
      switch (op) {
        case '=':
          return aStr === eStr;
        case '!=':
        case '<>':
          return aStr !== eStr;
        case '>':
          return aStr > eStr;
        case '<':
          return aStr < eStr;
        case '>=':
          return aStr >= eStr;
        case '<=':
          return aStr <= eStr;
        default:
          return false;
      }
    });
  });
}

function computeAggregate(rows: SqlRow[], expr: string): number {
  const m = expr.trim().match(/^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([\w.*]+)\s*\)$/i);
  if (!m) return 0;
  const fn = m[1].toUpperCase();
  const field = m[2];
  if (fn === 'COUNT') {
    if (field === '*') return rows.length;
    return rows.filter((r) => getColValue(r, field) !== undefined).length;
  }
  const nums = rows
    .map((r) => Number(getColValue(r, field)))
    .filter((n) => !Number.isNaN(n));
  if (nums.length === 0) return 0;
  if (fn === 'SUM') return nums.reduce((a, b) => a + b, 0);
  if (fn === 'AVG') return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1));
  if (fn === 'MIN') return Math.min(...nums);
  if (fn === 'MAX') return Math.max(...nums);
  return 0;
}

export function executeLocalSql(rawQuery: string): SqlExecutionResult {
  const normalized = rawQuery.trim().replace(/;+$/, '').replace(/\s+/g, ' ');
  if (!normalized) {
    return { ok: false, columns: [], rows: [], message: 'Empty SQL command.' };
  }

  // Handle UPDATE preview on cloned table
  const updateMatch = normalized.match(
    /^UPDATE\s+(\w+)\s+SET\s+([\w]+)\s*=\s*([^W]+?)(?:\s+WHERE\s+(.+))?$/i
  );
  if (updateMatch) {
    const [, tableName, setCol, setRawVal, whereClause] = updateMatch;
    const tKey = tableName.toLowerCase() as keyof typeof SAMPLE_TABLES;
    const schema = SAMPLE_TABLES[tKey];
    if (!schema) {
      return { ok: false, columns: [], rows: [], message: `Unknown table: ${tableName}` };
    }
    const val = parseValue(setRawVal);
    let affected = 0;
    const updatedRows = schema.rows.map((r) => {
      if (!whereClause || evalCondition(r, whereClause)) {
        affected++;
        return { ...r, [setCol]: val };
      }
      return { ...r };
    });
    return {
      ok: true,
      columns: schema.columns,
      rows: updatedRows,
      affectedCount: affected,
      message: `UPDATE PREVIEW: ${affected} row(s) updated.`,
    };
  }

  // Handle DELETE preview on cloned table
  const deleteMatch = normalized.match(/^DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.+))?$/i);
  if (deleteMatch) {
    const [, tableName, whereClause] = deleteMatch;
    const tKey = tableName.toLowerCase() as keyof typeof SAMPLE_TABLES;
    const schema = SAMPLE_TABLES[tKey];
    if (!schema) {
      return { ok: false, columns: [], rows: [], message: `Unknown table: ${tableName}` };
    }
    const remaining = whereClause
      ? schema.rows.filter((r) => !evalCondition(r, whereClause))
      : [];
    const affected = schema.rows.length - remaining.length;
    return {
      ok: true,
      columns: schema.columns,
      rows: remaining,
      affectedCount: affected,
      message: `DELETE PREVIEW: ${affected} row(s) removed.`,
    };
  }

  // Handle SELECT
  const selectMatch = normalized.match(
    /^SELECT\s+(.+?)\s+FROM\s+(\w+)(?:\s+(?:INNER\s+)?JOIN\s+(\w+)\s+ON\s+([\w.]+)\s*=\s*([\w.]+))?(?:\s+WHERE\s+(.+?))?(?:\s+GROUP\s+BY\s+([\w.,\s]+?))?(?:\s+HAVING\s+(.+?))?(?:\s+ORDER\s+BY\s+(.+?))?(?:\s+LIMIT\s+(\d+))?$/i
  );

  if (!selectMatch) {
    return {
      ok: false,
      columns: [],
      rows: [],
      message: 'Syntax error. Expected SELECT ... FROM ... [WHERE ...] [GROUP BY ...] [ORDER BY ...]',
    };
  }

  const [
    ,
    selectListRaw,
    baseTableRaw,
    joinTableRaw,
    joinLeft,
    joinRight,
    whereClause,
    groupByRaw,
    havingClause,
    orderByRaw,
    limitRaw,
  ] = selectMatch;

  const baseKey = baseTableRaw.toLowerCase() as keyof typeof SAMPLE_TABLES;
  const baseSchema = SAMPLE_TABLES[baseKey];
  if (!baseSchema) {
    return { ok: false, columns: [], rows: [], message: `Table not found: ${baseTableRaw}` };
  }

  let workingRows: SqlRow[] = baseSchema.rows.map((r) => {
    const prefixed: SqlRow = { ...r };
    for (const [k, v] of Object.entries(r)) {
      prefixed[`${baseKey}.${k}`] = v;
    }
    return prefixed;
  });

  let availableCols = [...baseSchema.columns];

  if (joinTableRaw) {
    const joinKey = joinTableRaw.toLowerCase() as keyof typeof SAMPLE_TABLES;
    const joinSchema = SAMPLE_TABLES[joinKey];
    if (!joinSchema) {
      return { ok: false, columns: [], rows: [], message: `Join table not found: ${joinTableRaw}` };
    }
    const joined: SqlRow[] = [];
    for (const lRow of workingRows) {
      for (const rRow of joinSchema.rows) {
        const prefixedR: SqlRow = {};
        for (const [k, v] of Object.entries(rRow)) {
          prefixedR[`${joinKey}.${k}`] = v;
          if (!(k in lRow)) {
            prefixedR[k] = v;
          }
        }
        const combined: SqlRow = { ...lRow, ...prefixedR };
        const leftVal = getColValue(combined, joinLeft);
        const rightVal = getColValue(combined, joinRight);
        if (leftVal !== undefined && leftVal === rightVal) {
          joined.push(combined);
        }
      }
    }
    workingRows = joined;
    availableCols = Array.from(new Set([...availableCols, ...joinSchema.columns]));
  }

  if (whereClause) {
    workingRows = workingRows.filter((row) => evalCondition(row, whereClause));
  }

  const selectItems = selectListRaw.split(',').map((s) => s.trim());
  const hasAgg = selectItems.some((item) => /^(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(item));

  let outputRows: SqlRow[] = [];
  let outputColumns: string[] = [];

  if (groupByRaw) {
    const groupField = groupByRaw.trim();
    const groups = new Map<string, SqlRow[]>();
    for (const r of workingRows) {
      const keyVal = String(getColValue(r, groupField) ?? 'NULL');
      if (!groups.has(keyVal)) groups.set(keyVal, []);
      groups.get(keyVal)!.push(r);
    }

    for (const [, grpRows] of groups.entries()) {
      const outRow: SqlRow = {};
      for (const item of selectItems) {
        const aliasMatch = item.match(/^(.+?)\s+AS\s+(\w+)$/i);
        const expr = aliasMatch ? aliasMatch[1].trim() : item;
        const label = aliasMatch ? aliasMatch[2].trim() : expr;
        if (/^(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(expr)) {
          outRow[label] = computeAggregate(grpRows, expr);
        } else {
          outRow[label] = getColValue(grpRows[0], expr) ?? '';
        }
      }
      if (havingClause) {
        // evaluate having against outRow or aggregate
        const m = havingClause.trim().match(/^(.+?)\s*(=|!=|>=|<=|>|<)\s*(.+)$/);
        if (m) {
          const [, lhsExpr, op, rhsRaw] = m;
          const lhsVal = /^(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(lhsExpr.trim())
            ? computeAggregate(grpRows, lhsExpr.trim())
            : Number(getColValue(outRow, lhsExpr.trim()) ?? 0);
          const rhsVal = Number(parseValue(rhsRaw));
          const pass =
            op === '>'
              ? lhsVal > rhsVal
              : op === '<'
              ? lhsVal < rhsVal
              : op === '>='
              ? lhsVal >= rhsVal
              : op === '<='
              ? lhsVal <= rhsVal
              : op === '='
              ? lhsVal === rhsVal
              : lhsVal !== rhsVal;
          if (!pass) continue;
        }
      }
      outputRows.push(outRow);
    }
    outputColumns = selectItems.map((item) => {
      const aliasMatch = item.match(/^(.+?)\s+AS\s+(\w+)$/i);
      return aliasMatch ? aliasMatch[2].trim() : item;
    });
  } else if (hasAgg) {
    const outRow: SqlRow = {};
    for (const item of selectItems) {
      const aliasMatch = item.match(/^(.+?)\s+AS\s+(\w+)$/i);
      const expr = aliasMatch ? aliasMatch[1].trim() : item;
      const label = aliasMatch ? aliasMatch[2].trim() : expr;
      if (/^(COUNT|SUM|AVG|MIN|MAX)\s*\(/i.test(expr)) {
        outRow[label] = computeAggregate(workingRows, expr);
      } else {
        outRow[label] = workingRows[0] ? getColValue(workingRows[0], expr) ?? '' : '';
      }
    }
    outputRows = [outRow];
    outputColumns = Object.keys(outRow);
  } else {
    if (selectItems.length === 1 && selectItems[0] === '*') {
      outputColumns = availableCols;
      outputRows = workingRows.map((r) => {
        const clean: SqlRow = {};
        for (const c of outputColumns) {
          clean[c] = r[c] ?? '';
        }
        return clean;
      });
    } else {
      outputColumns = selectItems.map((item) => {
        const aliasMatch = item.match(/^(.+?)\s+AS\s+(\w+)$/i);
        return aliasMatch ? aliasMatch[2].trim() : item;
      });
      outputRows = workingRows.map((r) => {
        const clean: SqlRow = {};
        for (const item of selectItems) {
          const aliasMatch = item.match(/^(.+?)\s+AS\s+(\w+)$/i);
          const expr = aliasMatch ? aliasMatch[1].trim() : item;
          const label = aliasMatch ? aliasMatch[2].trim() : expr;
          clean[label] = getColValue(r, expr) ?? '';
        }
        return clean;
      });
    }
  }

  if (orderByRaw) {
    const orderMatch = orderByRaw.trim().match(/^([\w.()]+)(?:\s+(ASC|DESC))?$/i);
    if (orderMatch) {
      const [, field, dir] = orderMatch;
      const desc = dir?.toUpperCase() === 'DESC';
      outputRows.sort((a, b) => {
        const va = getColValue(a, field) ?? '';
        const vb = getColValue(b, field) ?? '';
        if (typeof va === 'number' && typeof vb === 'number') {
          return desc ? vb - va : va - vb;
        }
        return desc
          ? String(vb).localeCompare(String(va))
          : String(va).localeCompare(String(vb));
      });
    }
  }

  if (limitRaw) {
    outputRows = outputRows.slice(0, Number(limitRaw));
  }

  return {
    ok: true,
    columns: outputColumns,
    rows: outputRows,
  };
}
