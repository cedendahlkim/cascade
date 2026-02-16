# Task: gen-dict-char_count-2805 | Score: 100% | 2026-02-13T09:20:43.721980

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))