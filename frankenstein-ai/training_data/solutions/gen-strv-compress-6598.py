# Task: gen-strv-compress-6598 | Score: 100% | 2026-02-15T10:28:46.622696

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))