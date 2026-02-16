# Task: gen-strv-compress-2983 | Score: 100% | 2026-02-15T08:48:36.850382

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))