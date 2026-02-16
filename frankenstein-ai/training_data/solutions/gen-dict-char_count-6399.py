# Task: gen-dict-char_count-6399 | Score: 100% | 2026-02-13T09:12:22.257167

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))