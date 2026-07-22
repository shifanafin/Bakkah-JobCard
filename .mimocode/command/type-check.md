---
description: "Run TypeScript type-check and report errors clearly"
---

# Type Check

Run the project's TypeScript type checker and output a clean error report.

## Steps

1. Run from the project root:
   ```bash
   npx tsc --noEmit -p tsconfig.json 2>&1 | head -150
   ```
2. If output is empty → **pass**, report "No type errors."
3. If errors found → list each error with file, line, column, and message.
4. For each error, suggest the fix if obvious (wrong type, missing import, etc.).
5. If the user wants to auto-fix, apply the edits then re-run the check.

## Notes

- This project uses Next.js 16 with TypeScript 5.7.
- Common error sources: React 19 `useActionState` async usage, Supabase client typing, missing `await` in Server Actions.
- If errors are in generated files (`.next/types/`), note they can be ignored.
