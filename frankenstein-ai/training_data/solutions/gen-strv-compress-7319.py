# Task: gen-strv-compress-7319 | Score: 100% | 2026-02-15T09:33:58.491389

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))