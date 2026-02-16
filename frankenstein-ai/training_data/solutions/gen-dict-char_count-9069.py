# Task: gen-dict-char_count-9069 | Score: 100% | 2026-02-15T10:50:59.078080

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))