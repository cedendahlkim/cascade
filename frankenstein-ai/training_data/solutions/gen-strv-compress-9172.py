# Task: gen-strv-compress-9172 | Score: 100% | 2026-02-13T16:47:24.707951

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))