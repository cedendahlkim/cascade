# Task: gen-dict-char_count-7012 | Score: 100% | 2026-02-15T12:30:00.028059

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))