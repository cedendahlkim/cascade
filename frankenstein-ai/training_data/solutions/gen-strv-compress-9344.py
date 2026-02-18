# Task: gen-strv-compress-9344 | Score: 100% | 2026-02-17T20:00:28.544776

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))