# Task: gen-strv-compress-3424 | Score: 100% | 2026-02-15T08:47:27.269709

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))