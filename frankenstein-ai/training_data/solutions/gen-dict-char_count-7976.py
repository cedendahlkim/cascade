# Task: gen-dict-char_count-7976 | Score: 100% | 2026-02-13T18:22:59.591515

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))