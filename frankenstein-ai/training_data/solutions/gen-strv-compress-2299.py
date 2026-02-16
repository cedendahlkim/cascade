# Task: gen-strv-compress-2299 | Score: 100% | 2026-02-15T08:06:36.379611

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))