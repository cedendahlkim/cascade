# Task: gen-strv-compress-7454 | Score: 100% | 2026-02-15T12:03:42.181722

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))