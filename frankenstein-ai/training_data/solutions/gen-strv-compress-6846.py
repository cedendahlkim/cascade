# Task: gen-strv-compress-6846 | Score: 100% | 2026-02-13T10:14:37.616023

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))