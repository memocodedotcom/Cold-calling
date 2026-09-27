# Mission 4 — Import

## Deployment status

The implementation and 31 local checks are complete. Migration `0004_lead_import.sql` was applied successfully to the connected Supabase project on 21 September 2026. Upload, mapping, and preview were verified in the browser; no fabricated prospects were committed to the live database. On a fresh project, apply all four migrations in numeric order.

## User flow

Leads → Import leads → choose a CSV or XLSX → select a worksheet if needed → map Company, Phone, Industry, City, Notes → review → import. Company is required. Other fields are optional. Invalid rows block the whole import; fix the file or mapping and preview again. The preview shows 20 rows, but all valid mapped rows are processed.

Files are parsed on the server in memory; original uploads are not saved to storage. Up to 2 MB per file, 500 data rows per sheet, 50 columns, 1,000 rows across visible Excel sheets, and 2 MB of extracted Excel data. The first nonempty row provides headers. CSV supports UTF-8/BOM and comma, semicolon, or tab separators. Quoted newlines are supported. CSV row numbers are logical record positions; Excel uses worksheet row numbers. Older XLS files must be saved as XLSX. Formula cells are rejected; paste values first. Use text-formatted phones to preserve country codes and leading zeros; simple zero-padding Excel formats are preserved too.

## Persistence and duplicate handling

The import function runs with the current user's permissions. It creates companies, optional Primary contact records when phones are supplied, leads assigned to the importing user with New/Normal defaults, and note activities. Any row failure rolls back the whole transaction.

A duplicate is an accessible existing lead with the same case-insensitive trimmed company name, city, and phone digits. This includes repeated rows within the batch. No fuzzy matching, international-number equivalence, or cross-user private-data matching is attempted. Existing records and notes are never overwritten. Concurrent imports by the same user are serialized. Manually created records and imports by different users can still produce duplicates; deduplication is an import convenience rather than a global uniqueness constraint.

An import UUID and payload hash track committed results in `lead_imports`; retrying the identical batch returns its original counts. A changed payload with the same UUID is rejected. Reports are private to their owner. All four migrations and import/parser tests run with `npm test`.

## Dependencies

ExcelJS reads XLSX; csv-parse reads CSV. fflate inspects ZIP expansion sizes before parsing XLSX. ExcelJS's transitive uuid dependency is pinned to 11.1.1 to address its dependency audit finding while retaining CommonJS v4 compatibility. Build and parser tests cover that override.

References: [CSV parser options](https://csv.js.org/parse/options/), [ExcelJS](https://github.com/exceljs/exceljs), [fflate](https://github.com/101arrowz/fflate).

