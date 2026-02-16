# Task: gen-strv-compress-8163 | Score: 100% | 2026-02-15T10:50:19.070832

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))