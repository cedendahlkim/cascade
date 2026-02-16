# Task: gen-strv-compress-4890 | Score: 100% | 2026-02-15T08:48:45.969307

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))