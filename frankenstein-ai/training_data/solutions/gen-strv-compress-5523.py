# Task: gen-strv-compress-5523 | Score: 100% | 2026-02-15T13:01:09.244947

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))