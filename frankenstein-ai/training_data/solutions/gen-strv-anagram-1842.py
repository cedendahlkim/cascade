# Task: gen-strv-anagram-1842 | Score: 100% | 2026-02-14T12:48:44.035391

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')