# Task: gen-dict-char_count-4965 | Score: 100% | 2026-02-13T09:20:50.529439

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))