# Task: gen-dict-char_count-6093 | Score: 100% | 2026-02-13T14:56:41.296671

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))