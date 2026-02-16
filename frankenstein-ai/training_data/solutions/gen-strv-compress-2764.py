# Task: gen-strv-compress-2764 | Score: 100% | 2026-02-13T10:39:33.664778

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))