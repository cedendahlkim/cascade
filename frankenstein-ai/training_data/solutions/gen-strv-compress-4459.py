# Task: gen-strv-compress-4459 | Score: 100% | 2026-02-17T20:34:59.752271

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))