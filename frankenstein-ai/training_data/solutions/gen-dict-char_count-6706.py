# Task: gen-dict-char_count-6706 | Score: 100% | 2026-02-13T10:39:30.699174

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))