# Task: gen-strv-compress-4582 | Score: 100% | 2026-02-14T12:28:42.838208

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))