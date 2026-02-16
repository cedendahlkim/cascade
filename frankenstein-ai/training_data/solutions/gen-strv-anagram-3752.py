# Task: gen-strv-anagram-3752 | Score: 100% | 2026-02-15T07:53:45.785909

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')