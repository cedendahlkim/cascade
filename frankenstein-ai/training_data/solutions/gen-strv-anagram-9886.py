# Task: gen-strv-anagram-9886 | Score: 100% | 2026-02-14T12:04:23.383422

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')