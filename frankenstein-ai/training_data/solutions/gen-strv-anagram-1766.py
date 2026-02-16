# Task: gen-strv-anagram-1766 | Score: 100% | 2026-02-15T08:06:38.893853

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')