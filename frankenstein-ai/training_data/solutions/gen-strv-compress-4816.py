# Task: gen-strv-compress-4816 | Score: 100% | 2026-02-15T08:24:48.179436

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))