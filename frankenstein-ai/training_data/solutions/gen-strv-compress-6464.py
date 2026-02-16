# Task: gen-strv-compress-6464 | Score: 100% | 2026-02-15T10:29:00.920896

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))