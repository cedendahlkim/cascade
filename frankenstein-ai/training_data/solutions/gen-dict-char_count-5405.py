# Task: gen-dict-char_count-5405 | Score: 100% | 2026-02-14T12:03:03.316526

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))