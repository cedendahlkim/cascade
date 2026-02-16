# Task: gen-dict-char_count-2225 | Score: 100% | 2026-02-13T18:46:05.626928

s = input().replace(' ', '')
for c in sorted(set(s)):
    print(c, s.count(c))