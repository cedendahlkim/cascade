# Task: gen-dict-char_count-6240 | Score: 100% | 2026-02-13T11:42:58.245997

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))