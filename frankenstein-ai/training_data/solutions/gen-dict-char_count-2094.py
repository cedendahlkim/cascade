# Task: gen-dict-char_count-2094 | Score: 100% | 2026-02-13T11:09:08.617063

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))