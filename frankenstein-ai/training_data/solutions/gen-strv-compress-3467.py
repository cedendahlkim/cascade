# Task: gen-strv-compress-3467 | Score: 100% | 2026-02-14T12:05:20.882965

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))