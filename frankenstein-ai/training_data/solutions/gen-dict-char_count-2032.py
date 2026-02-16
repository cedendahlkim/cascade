# Task: gen-dict-char_count-2032 | Score: 100% | 2026-02-15T14:00:00.253272

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))