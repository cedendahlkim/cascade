# Task: gen-strv-compress-9132 | Score: 100% | 2026-02-13T09:17:03.712542

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))