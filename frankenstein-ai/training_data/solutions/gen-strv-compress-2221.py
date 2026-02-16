# Task: gen-strv-compress-2221 | Score: 100% | 2026-02-15T11:12:44.426911

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))