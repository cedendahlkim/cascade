# Task: gen-dict-char_count-2483 | Score: 100% | 2026-02-13T09:43:31.782701

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))