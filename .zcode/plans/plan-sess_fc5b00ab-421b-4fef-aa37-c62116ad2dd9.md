## Change the block label color in MonthOutlookCard

The user wants each block tier on the prediction card ("Procjena") to have a distinct color:
- **Blok I** → bright green (#22c55e)
- **Blok II** → orange (#f97316)  
- **Blok III** → bright red (#ef4444)

### Changes needed in 1 file:

**`src/components/MonthOutlookCard.tsx`**
1. Add a `blockColor(label)` helper function that picks a color based on block label text (same pattern already used in `BillBreakdown.tsx`)
2. Change `className="... text-[var(--accent-strong)]"` on the block label span to use `style={{ color: blockColor(topBlock.label) }}`

This is a minimal, risk-free change — no logic changes, no new dependencies, just CSS color substitution.