# Task: gen-strv-compress-9533 | Score: 100% | 2026-02-14T12:28:43.316420

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))