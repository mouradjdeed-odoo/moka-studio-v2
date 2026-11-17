<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Static marketing site migrated from Next.js; quote form posts to a createServerFn in src/lib/quote.functions.ts, validation rules live in src/lib/quote.ts (shared client/server).
- Business units and sub-services are configured in src/lib/site.ts (`allServices`, `enabled` flags); components read the filtered `services` export so toggling never breaks layouts.
- Sub-service detail texts and legal notices live in src/lib/i18n/sub-services.ts, keyed by sub-service id.
- Quote `service` field is a comma-separated list of unit ids; scope/distance rules apply when the related unit is included.
