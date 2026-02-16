# Task: gen-strv-compress-6835 | Score: 100% | 2026-02-13T19:05:35.322415

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))