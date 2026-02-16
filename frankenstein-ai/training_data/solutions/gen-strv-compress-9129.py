# Task: gen-strv-compress-9129 | Score: 100% | 2026-02-15T09:02:19.867568

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))