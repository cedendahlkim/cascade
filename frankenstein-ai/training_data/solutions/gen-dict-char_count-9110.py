# Task: gen-dict-char_count-9110 | Score: 100% | 2026-02-13T14:41:06.100997

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))