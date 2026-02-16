# Task: gen-strv-compress-7707 | Score: 100% | 2026-02-13T15:46:20.640136

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))