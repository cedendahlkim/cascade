# Task: gen-strv-compress-7174 | Score: 100% | 2026-02-13T09:52:53.468835

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))