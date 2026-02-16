# Task: gen-dict-char_count-7323 | Score: 100% | 2026-02-15T10:09:51.212844

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))