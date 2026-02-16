# Task: gen-dict-char_count-6587 | Score: 100% | 2026-02-13T19:48:11.085529

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))