# Task: gen-strv-compress-2278 | Score: 100% | 2026-02-15T10:09:55.675382

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))