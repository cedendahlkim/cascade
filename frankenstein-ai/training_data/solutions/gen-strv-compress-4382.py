# Task: gen-strv-compress-4382 | Score: 100% | 2026-02-13T19:48:30.318573

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))