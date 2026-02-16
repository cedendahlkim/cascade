# Task: gen-strv-compress-3229 | Score: 100% | 2026-02-13T18:43:47.890456

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))