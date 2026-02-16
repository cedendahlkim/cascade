# Task: gen-dict-char_count-3778 | Score: 100% | 2026-02-13T13:11:39.144392

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))