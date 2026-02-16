# Task: gen-strv-compress-7417 | Score: 100% | 2026-02-13T18:19:33.555586

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))