# Task: gen-strv-compress-1361 | Score: 100% | 2026-02-14T12:08:57.511129

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))