# Task: gen-dict-char_count-6367 | Score: 100% | 2026-02-15T08:14:23.191668

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))