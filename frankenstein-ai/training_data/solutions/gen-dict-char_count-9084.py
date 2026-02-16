# Task: gen-dict-char_count-9084 | Score: 100% | 2026-02-13T18:32:18.219209

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))