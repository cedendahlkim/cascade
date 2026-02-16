# Task: gen-dict-char_count-3871 | Score: 100% | 2026-02-14T12:20:54.534058

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))