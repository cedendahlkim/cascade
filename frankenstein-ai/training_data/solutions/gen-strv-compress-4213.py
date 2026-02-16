# Task: gen-strv-compress-4213 | Score: 100% | 2026-02-13T17:36:01.583642

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))