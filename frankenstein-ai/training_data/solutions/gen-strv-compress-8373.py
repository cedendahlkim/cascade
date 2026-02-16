# Task: gen-strv-compress-8373 | Score: 100% | 2026-02-14T12:27:59.779776

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))