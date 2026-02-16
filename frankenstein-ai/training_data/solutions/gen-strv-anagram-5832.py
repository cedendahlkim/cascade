# Task: gen-strv-anagram-5832 | Score: 100% | 2026-02-15T07:53:46.677791

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')