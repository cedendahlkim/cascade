# Task: gen-strv-compress-7356 | Score: 100% | 2026-02-15T08:05:39.471573

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))