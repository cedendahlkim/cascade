# Task: gen-strv-compress-7535 | Score: 100% | 2026-02-15T10:51:23.533138

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))