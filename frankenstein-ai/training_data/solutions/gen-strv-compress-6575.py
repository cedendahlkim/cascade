# Task: gen-strv-compress-6575 | Score: 100% | 2026-02-15T08:48:25.825220

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))