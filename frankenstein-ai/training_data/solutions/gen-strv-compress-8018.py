# Task: gen-strv-compress-8018 | Score: 100% | 2026-02-13T19:14:56.036945

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))