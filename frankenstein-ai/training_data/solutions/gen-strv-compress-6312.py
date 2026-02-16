# Task: gen-strv-compress-6312 | Score: 100% | 2026-02-15T08:06:37.448104

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))