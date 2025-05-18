# Supabase Edge Functions

This directory contains Edge Functions that run on Supabase to support the notification system.

## Directory Structure

- `process-notifications/` - Edge Function for processing notification tasks
  - `index.ts` - Main Edge Function code
  - `deno.d.ts` - Type definitions for Deno
  - `tsconfig.json` - TypeScript configuration for the function

- `deno.json` - Deno configuration for all functions
- `import_map.json` - Import map for Deno modules

## Development

### Local Development

To run the function locally:

```bash
# From the supabase/functions directory
deno task dev
```

### Deployment

To deploy the function to Supabase:

```bash
supabase functions deploy process-notifications --project-ref your-project-ref
```

### Configuration

After deployment, set up the scheduled jobs in the Supabase Dashboard:

1. Daily initialization job (runs once a day)
2. Processing job (runs every 15 minutes)

See `process-notifications/deployment-instructions.md` for detailed configuration steps. 