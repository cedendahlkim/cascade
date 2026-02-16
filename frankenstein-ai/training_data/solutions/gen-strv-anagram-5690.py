# Task: gen-strv-anagram-5690 | Score: 100% | 2026-02-15T13:30:35.481125

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')