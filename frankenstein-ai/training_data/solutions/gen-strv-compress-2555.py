# Task: gen-strv-compress-2555 | Score: 100% | 2026-02-15T10:50:29.802613

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))