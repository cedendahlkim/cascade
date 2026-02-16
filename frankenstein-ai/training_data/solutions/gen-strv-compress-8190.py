# Task: gen-strv-compress-8190 | Score: 100% | 2026-02-15T10:50:18.705682

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))