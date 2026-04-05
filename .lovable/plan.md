

## Fix: Patient Role Badge Visibility in Light Mode

**Problem:** The patient badge uses `text-accent-foreground` which resolves to white in light mode, making the icon and text invisible against the light `bg-accent/10` background.

**Solution:** Change the patient badge styling from `bg-accent/10 text-accent-foreground` to `bg-accent/10 text-accent` — matching the pattern used for the doctor badge (`bg-primary/10 text-primary`).

### File Change
**`src/components/Navigation.tsx` (line 130)**
- Change: `"bg-accent/10 text-accent-foreground"` → `"bg-accent/10 text-accent"`

This makes the patient badge text/icon use the accent color (visible blue) instead of accent-foreground (white), consistent with how the doctor badge works.

