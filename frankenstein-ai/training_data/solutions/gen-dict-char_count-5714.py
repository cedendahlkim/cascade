# Task: gen-dict-char_count-5714 | Score: 100% | 2026-02-15T09:34:45.120532

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))