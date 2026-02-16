# Task: gen-strv-anagram-1626 | Score: 100% | 2026-02-15T13:30:48.634031

a = input()
b = input()
print('yes' if sorted(a.lower().replace(' ', '')) == sorted(b.lower().replace(' ', '')) else 'no')