# Task: gen-strv-anagram-3799 | Score: 100% | 2026-02-14T12:20:16.230135

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')