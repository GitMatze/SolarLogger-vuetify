# Grid Meter update
For correct yearly stats, the following operation was executed:
```sql
Enter ".help" for usage hints.
sqlite> UPDATE energy
   ...> SET grid_out = grid_out - 8794505180
   ...> WHERE strftime('%Y', time) = '2024'
   ...> AND strftime('%m', time) <= '04';
sqlite> UPDATE energy
   ...> SET grid_in = grid_in - 27489159463
   ...> WHERE strftime('%Y', time) = '2024'
   ...> AND strftime('%m', time) <= '04';
```
From  may, grid meter counts start from 0, with this subtractions the diffs are valid again.
Unfortunately, entries of month april have been lost.