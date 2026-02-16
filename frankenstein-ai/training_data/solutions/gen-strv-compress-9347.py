# Task: gen-strv-compress-9347 | Score: 100% | 2026-02-15T08:15:07.918452

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))