# Task: gen-dict-char_count-2650 | Score: 100% | 2026-02-13T14:56:46.809983

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))