# Task: gen-strv-compress-1955 | Score: 100% | 2026-02-15T10:51:22.917993

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))