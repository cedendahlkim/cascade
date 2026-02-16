# Task: gen-strv-compress-2455 | Score: 100% | 2026-02-13T12:13:19.844790

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))