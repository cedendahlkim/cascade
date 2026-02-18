# Task: gen-strv-compress-8808 | Score: 100% | 2026-02-17T20:35:01.104590

from itertools import groupby
s = input()
print(''.join(c + str(len(list(g))) for c, g in groupby(s)))