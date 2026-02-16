# Task: gen-strv-compress-1696 | Score: 100% | 2026-02-15T09:02:18.849616

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))